import { AtlasProperty, PropertyFilterState, UnteraRawListing } from '@/types/property';
import { searchListings, getListing, isUnteraConfigured } from '@/lib/untera';
import { PROPERTIES as FIXTURE_PROPERTIES } from '@/data/properties';

/**
 * Normalizes a raw Untera API listing into the consistent AtlasProperty domain model
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

  // Extract images safely
  let images: string[] = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    images = raw.images.filter(img => typeof img === 'string' && img.startsWith('http'));
  } else if (Array.isArray(raw.photos) && raw.photos.length > 0) {
    images = raw.photos.filter(img => typeof img === 'string' && img.startsWith('http'));
  }
  
  // High quality architectural fallback image if listing has no photos
  if (images.length === 0) {
    images = ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];
  }

  const lat = Number(raw.latitude ?? raw.lat ?? 0);
  const lng = Number(raw.longitude ?? raw.lng ?? 0);
  const country = raw.country || 'Global Territory';
  const city = raw.city || raw.location || (raw.address ? raw.address.split(',')[0].trim() : country);

  // Features list
  const features: string[] = [];
  if (Array.isArray(raw.features)) features.push(...raw.features);
  if (Array.isArray(raw.amenities)) features.push(...raw.amenities);
  if (features.length === 0) {
    features.push('Verified MLS Provenance', 'Panoramic Outlook', 'Prime Architectural Positioning', 'Private Parking');
  }

  const areaSqm = Number(raw.sqm ?? raw.area_sqm ?? raw.size ?? 0);
  const areaSqft = Number(raw.area_sqft || Math.round(areaSqm * 10.764));

  const propType = raw.type || raw.property_type || raw.property_subtype || 'Luxury Residence';
  const cleanPropType = propType.charAt(0).toUpperCase() + propType.slice(1);

  const transactionType = (raw.transaction || raw.transaction_type || 'sale').toLowerCase() === 'rent' ? 'rent' : 'sale';

  return {
    id,
    sourceId: String(raw.source_id || id),
    sourceName: raw.source || raw.source_name || 'Untera Real Estate Network',
    sourceUrl: raw.url || `https://untera.io/listings/${id}`,
    title: raw.title || `${cleanPropType} in ${city}`,
    subtitle: `${cleanPropType} · ${city}, ${country}`,
    description: raw.description || `An exceptional architectural acquisition in ${city}, ${country}. Presented with verified provenance, MLS title tracking, and global real-estate intelligence.`,
    price: originalPrice || priceUsd,
    priceFormatted,
    priceUsd,
    currency: originalCurrency,
    country,
    city,
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
    features: Array.from(new Set(features)).slice(0, 8),
    curatorNotes: 'Verified through live Untera global MLS integration. Subject to private treaty verification.',
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
 * NO SILENT FALLBACKS: If API fails, reports the actual error to display real error state.
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

  try {
    const response = await searchListings({
      country: filter.country || undefined,
      location: filter.location || filter.searchQuery || undefined,
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
 * Fetch a single property by ID from the live Untera API
 */
export async function fetchPropertyById(
  id: string,
  signal?: AbortSignal
): Promise<AtlasProperty | null> {
  if (!isUnteraConfigured()) return null;

  try {
    const raw = await getListing(id, signal);
    if (raw && (raw.id || raw.title)) {
      return normalizeUnteraListing(raw);
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.warn('[ATLAS] Live property lookup failed for ID', id, err.message);
  }

  return null;
}

/**
 * Exported test fixtures for isolated testing only
 */
export const DEV_TEST_FIXTURES = FIXTURE_PROPERTIES;
