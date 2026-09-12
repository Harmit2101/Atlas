import { AtlasProperty, PropertyFilterState, UnteraRawListing } from '@/types/property';
import { searchListings, getListing, isUnteraConfigured } from '@/lib/untera';
import { resolveListingLocation } from '@/services/geoService';
import { fetchGlobalDiscoveryFeed } from '@/services/globalDiscoveryService';

/**
 * Resolves full, valid image URLs strictly from the listing's actual data.
 * Supports both absolute CDN URLs and Untera relative image paths.
 * Returns empty array if no genuine listing imagery is present.
 * NEVER returns a fake or hardcoded fallback image.
 */
export function normalizeListingImages(raw: UnteraRawListing): string[] {
  const candidates: any[] = [];
  if (Array.isArray(raw.images)) candidates.push(...raw.images);
  if (Array.isArray(raw.photos)) candidates.push(...raw.photos);
  if (typeof (raw as any).image === 'string') candidates.push((raw as any).image);
  if (typeof (raw as any).photo === 'string') candidates.push((raw as any).photo);
  if (typeof (raw as any).image_url === 'string') candidates.push((raw as any).image_url);
  if (typeof (raw as any).imageUrl === 'string') candidates.push((raw as any).imageUrl);

  const images: string[] = [];
  const seen = new Set<string>();

  for (const item of candidates) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;

    let url: string;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      url = trimmed;
    } else if (trimmed.startsWith('//')) {
      url = `https:${trimmed}`;
    } else if (trimmed.startsWith('/')) {
      url = `https://api.untera.io${trimmed}`;
    } else {
      url = `https://api.untera.io/${trimmed}`;
    }

    if (!seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
  }

  return images;
}

/**
 * Normalizes a raw Untera API listing into the consistent AtlasProperty domain model.
 * Strictly preserves genuine Untera data with zero fabricated metrics or imagery.
 */
export function normalizeUnteraListing(raw: UnteraRawListing): AtlasProperty {
  const id = String(raw.id || raw.source_id || `prop-${Math.random().toString(36).substring(7)}`);
  const priceUsd = Number(raw.price_usd || raw.price || 0);
  const originalPrice = raw.original_price != null ? Number(raw.original_price) : null;
  const originalCurrency = raw.original_currency || raw.currency || 'USD';

  // Format price display
  let priceFormatted = priceUsd > 0 ? `$${priceUsd.toLocaleString()}` : 'Price on Inquiry';
  if (originalCurrency && originalCurrency !== 'USD' && originalPrice) {
    priceFormatted = `${originalCurrency} ${originalPrice.toLocaleString()} ($${priceUsd.toLocaleString()})`;
  } else if (originalCurrency === 'EUR' && originalPrice) {
    priceFormatted = `€${originalPrice.toLocaleString()}`;
  } else if (originalCurrency === 'GBP' && originalPrice) {
    priceFormatted = `£${originalPrice.toLocaleString()}`;
  }

  // Extract legitimate listing images (empty array if no photos provided by Untera)
  const images = normalizeListingImages(raw);
  const imageUrl = images[0] || undefined;

  const lat = Number(raw.latitude ?? raw.lat ?? 0);
  const lng = Number(raw.longitude ?? raw.lng ?? 0);
  
  // Resolve legitimate geographic information
  const loc = resolveListingLocation(raw);
  const country = loc.country;
  const city = loc.city;
  const displayLocation = loc.displayLocation;

  // Features list strictly from genuine API response
  const features: string[] = [];
  if (Array.isArray(raw.features)) {
    features.push(...raw.features.filter(f => typeof f === 'string' && f.trim()));
  }
  if (Array.isArray(raw.amenities)) {
    features.push(...raw.amenities.filter(a => typeof a === 'string' && a.trim()));
  }

  const areaSqm = Number(raw.sqm ?? raw.area_sqm ?? raw.size ?? 0);
  const areaSqft = Number(raw.area_sqft || (areaSqm > 0 ? Math.round(areaSqm * 10.764) : 0));

  const rawType = raw.property_subtype || raw.property_type || raw.type;
  const cleanPropType = rawType && typeof rawType === 'string' && rawType.trim()
    ? rawType.trim().charAt(0).toUpperCase() + rawType.trim().slice(1)
    : 'Property';

  const transactionType = (raw.transaction || raw.transaction_type || 'sale').toLowerCase() === 'rent' ? 'rent' : 'sale';

  const description = (raw.description || '').trim();
  const title = (raw.title && raw.title.trim()) || `${cleanPropType} in ${city || country || 'Global MLS'}`;
  const subtitle = displayLocation ? `${cleanPropType} · ${displayLocation}` : cleanPropType;

  return {
    id,
    sourceId: String(raw.source_id || id),
    sourceName: raw.source || raw.source_name || 'Untera Real Estate Network',
    sourceUrl: raw.url || `https://untera.io/listings/${id}`,
    title,
    subtitle,
    description,
    price: originalPrice || priceUsd,
    priceFormatted,
    priceUsd,
    currency: originalCurrency,
    country,
    city,
    locality: loc.locality,
    region: loc.region,
    displayLocation,
    address: raw.address || undefined,
    latitude: lat,
    longitude: lng,
    propertyType: cleanPropType,
    transactionType,
    bedrooms: Number(raw.bedrooms ?? raw.beds ?? 0),
    bathrooms: Number(raw.bathrooms ?? raw.baths ?? 0),
    areaSqm,
    areaSqft,
    yearBuilt: raw.year_built || undefined,
    images,
    imageUrl,
    features: Array.from(new Set(features)).slice(0, 8),
    curatorNotes: (raw as any).curator_notes || undefined,
    listedAt: raw.created_at || new Date().toISOString(),
    updatedAt: raw.updated_at || new Date().toISOString(),
    isLive: true,
    status: 'Verified Live MLS'
  };
}

export interface FetchPropertiesResult {
  properties: AtlasProperty[];
  total: number;
  page: number;
  pageSize: number;
  isLive: boolean;
  source: 'untera';
  error?: string;
}

/**
 * Fetch real live properties based on active filter state from Untera API.
 * Distinguishes MODE A (Global Discovery Feed across continents)
 * from MODE B (Targeted User Search for specific location/price/type).
 */
export async function fetchProperties(
  filter: PropertyFilterState = {},
  signal?: AbortSignal
): Promise<FetchPropertiesResult> {
  if (!isUnteraConfigured()) {
    return {
      properties: [],
      total: 0,
      page: 1,
      pageSize: 24,
      isLive: false,
      source: 'untera',
      error: 'Untera API service is not configured. Please configure UNTERA_API_KEY in server environment.'
    };
  }

  // Determine whether user has applied any explicit search/filter criteria
  const isUserSearch = Boolean(
    filter.country ||
    filter.location ||
    filter.searchQuery ||
    (filter.minPrice !== undefined && filter.minPrice > 0) ||
    (filter.maxPrice !== undefined && filter.maxPrice < 200000000) ||
    filter.bedrooms ||
    filter.bathrooms ||
    (filter.propertyType && filter.propertyType !== 'all') ||
    (filter.transactionType && filter.transactionType !== 'all') ||
    (filter.sortBy && filter.sortBy !== 'featured')
  );

  // MODE A: GLOBAL DISCOVERY FEED (Multi-continental live Untera sampling)
  if (!isUserSearch) {
    return await fetchGlobalDiscoveryFeed(filter.page || 1, signal);
  }

  // MODE B: TARGETED USER SEARCH (Single direct query for user-specified criteria)
  try {
    const response = await searchListings({
      country: filter.country || undefined,
      location: filter.location || filter.searchQuery || filter.country || undefined,
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
      minBeds: filter.bedrooms ? parseInt(filter.bedrooms, 10) : undefined,
      minBaths: filter.bathrooms ? parseInt(filter.bathrooms, 10) : undefined,
      minSqm: filter.minSqm,
      maxSqm: filter.maxSqm,
      type: filter.propertyType,
      transaction: filter.transactionType,
      sort: filter.sortBy,
      page: filter.page || 1,
      pageSize: filter.pageSize || 24
    }, signal);

    const rawListings = response.results || response.listings || response.data || [];
    const properties = rawListings.map(normalizeUnteraListing);

    return {
      properties,
      total: response.count || response.total || properties.length,
      page: response.page || filter.page || 1,
      pageSize: response.page_size || filter.pageSize || 24,
      isLive: true,
      source: 'untera'
    };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    const errorMsg = err.message || 'Failed to stream live listings from Untera API.';
    return {
      properties: [],
      total: 0,
      page: filter.page || 1,
      pageSize: filter.pageSize || 24,
      isLive: false,
      source: 'untera',
      error: errorMsg
    };
  }
}

/**
 * Generates candidate listing IDs to handle common slug delimiter differences
 * (such as underscores vs hyphens in provider prefixes and URL slugs).
 */
export function resolveListingIdCandidates(id: string): string[] {
  const candidates: string[] = [id];

  // If ID has underscores after a provider prefix (e.g., propertyfinder_qa_...):
  const prefixMatch = id.match(/^([a-z0-9]+_[a-z0-9]+_)(.*)$/i);
  if (prefixMatch) {
    const prefix = prefixMatch[1];
    const rest = prefixMatch[2];
    candidates.push(prefix + rest.replace(/_/g, '-'));
  }

  // Hyphenated variant (replace all underscores)
  candidates.push(id.replace(/_/g, '-'));

  // Underscore variant (replace all hyphens)
  candidates.push(id.replace(/-/g, '_'));

  return Array.from(new Set(candidates));
}

/**
 * Fetch a single property by ID from the live Untera API with fuzzy candidate resolution.
 */
export async function fetchPropertyById(
  id: string,
  signal?: AbortSignal
): Promise<AtlasProperty | null> {
  if (!isUnteraConfigured()) return null;

  const candidates = resolveListingIdCandidates(id);

  for (const candidateId of candidates) {
    try {
      const raw = await getListing(candidateId, signal);
      if (raw && (raw.id || raw.title)) {
        return normalizeUnteraListing(raw);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      // Continue trying next candidate if listing is not found
    }
  }

  console.warn('[ATLAS] Live property lookup failed for ID and all candidate variants:', id);
  return null;
}

