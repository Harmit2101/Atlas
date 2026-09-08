import { AtlasProperty, PropertyFilterState, UnteraRawListing } from '@/types/property';
import { searchListings, getListing, isUnteraConfigured } from '@/lib/untera';
import { PROPERTIES as FALLBACK_PROPERTIES } from '@/data/properties';

/**
 * Normalizes raw API listing into consistent AtlasProperty domain model
 */
export function normalizeUnteraListing(raw: UnteraRawListing): AtlasProperty {
  const id = String(raw.id || raw.source_id || `prop-${Math.random().toString(36).substring(7)}`);
  const rawPrice = Number(raw.price || raw.price_usd || 0);
  const currency = raw.currency || 'USD';
  
  // Format price
  let priceFormatted = `$${rawPrice.toLocaleString()}`;
  if (currency === 'EUR') priceFormatted = `€${rawPrice.toLocaleString()}`;
  else if (currency === 'GBP') priceFormatted = `£${rawPrice.toLocaleString()}`;
  else if (currency === 'AED') priceFormatted = `AED ${rawPrice.toLocaleString()}`;
  else if (rawPrice === 0) priceFormatted = 'Price on Inquiry';

  // Extract images safely
  let images: string[] = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    images = raw.images.filter(img => typeof img === 'string' && img.startsWith('http'));
  } else if (Array.isArray(raw.photos) && raw.photos.length > 0) {
    images = raw.photos.filter(img => typeof img === 'string' && img.startsWith('http'));
  }
  
  // Fallback architectural image if empty
  if (images.length === 0) {
    images = ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];
  }

  const lat = Number(raw.lat || raw.latitude || 25.2048);
  const lng = Number(raw.lng || raw.longitude || 55.2708);
  const country = raw.country || 'Global Territory';
  const city = raw.city || country;

  // Features list
  const features: string[] = [];
  if (Array.isArray(raw.features)) features.push(...raw.features);
  if (Array.isArray(raw.amenities)) features.push(...raw.amenities);
  if (features.length === 0) {
    features.push('Panoramic Outlook', 'Prime Architectural Positioning', 'Private Parking', 'Climate Controlled');
  }

  const areaSqm = Number(raw.area_sqm || raw.size || Math.round((raw.area_sqft || 5000) * 0.0929));
  const areaSqft = Number(raw.area_sqft || Math.round(areaSqm * 10.764));

  return {
    id,
    sourceId: String(raw.source_id || id),
    sourceName: raw.source_name || 'Untera Network',
    sourceUrl: raw.url || 'https://untera.io',
    title: raw.title || `${raw.property_type || 'Luxury Residence'} in ${city}`,
    subtitle: `${raw.property_type || 'Estate'} · ${city}, ${country}`,
    description: raw.description || `An exceptional architectural acquisition in ${city}, ${country}. Presented with verified provenance and discrete title protocols.`,
    price: rawPrice,
    priceFormatted,
    priceUsd: Number(raw.price_usd || rawPrice),
    currency,
    country,
    city,
    address: raw.address,
    latitude: lat,
    longitude: lng,
    propertyType: raw.property_type || raw.type || 'Estate',
    transactionType: (raw.transaction_type?.toLowerCase() as any) || 'sale',
    bedrooms: Number(raw.bedrooms || raw.beds || 4),
    bathrooms: Number(raw.bathrooms || raw.baths || 4),
    areaSqm,
    areaSqft,
    yearBuilt: raw.year_built || 2021,
    images,
    features: Array.from(new Set(features)).slice(0, 8),
    curatorNotes: 'Verified through live Untera global MLS integration. Subject to private treaty verification.',
    listedAt: raw.created_at || new Date().toISOString(),
    updatedAt: raw.updated_at || new Date().toISOString(),
    isLive: true,
    status: 'Verified Listing'
  };
}

/**
 * Normalizes local fallback properties to the AtlasProperty model
 */
function normalizeFallbackProperty(p: any): AtlasProperty {
  return {
    id: p.id,
    sourceId: p.id,
    sourceName: 'Atlas Curated Samples',
    sourceUrl: 'https://untera.io',
    title: p.title,
    subtitle: p.subtitle,
    description: p.description,
    price: p.price,
    priceFormatted: p.priceFormatted,
    priceUsd: p.price,
    currency: p.currency,
    country: p.country,
    city: p.city,
    latitude: p.coordinates?.lat || 25.2048,
    longitude: p.coordinates?.lng || 55.2708,
    propertyType: p.propertyType,
    transactionType: 'sale',
    bedrooms: p.specs.bedrooms,
    bathrooms: p.specs.bathrooms,
    areaSqm: p.specs.areaSqM,
    areaSqft: p.specs.areaSqFt,
    yearBuilt: p.specs.yearBuilt,
    images: p.gallery || [p.heroImage],
    features: p.keyFeatures || p.tags,
    curatorNotes: p.curatorNotes,
    listedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isLive: false,
    status: p.status || 'Curated Sample'
  };
}

export interface FetchPropertiesResult {
  properties: AtlasProperty[];
  total: number;
  isLive: boolean;
  source: 'untera' | 'fallback';
  error?: string;
}

/**
 * Fetch properties based on active filter state
 */
export async function fetchProperties(
  filter: PropertyFilterState = {},
  signal?: AbortSignal
): Promise<FetchPropertiesResult> {
  // If Untera key is configured, attempt live query
  if (isUnteraConfigured()) {
    try {
      const response = await searchListings({
        country: filter.country,
        city: filter.location,
        min_price: filter.minPrice,
        max_price: filter.maxPrice,
        bedrooms: filter.bedrooms ? parseInt(filter.bedrooms, 10) : undefined,
        property_type: filter.propertyType,
        transaction_type: filter.transactionType,
        q: filter.searchQuery,
        page: filter.page || 1,
        limit: 24,
        sort: filter.sortBy
      }, signal);

      const rawListings = response.listings || response.data || [];
      if (rawListings.length > 0) {
        const properties = rawListings.map(normalizeUnteraListing);
        return {
          properties,
          total: response.total || properties.length,
          isLive: true,
          source: 'untera'
        };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.warn('[ATLAS] Untera API fetch failed, falling back to curated assets:', err.message);
      return {
        properties: getFilteredFallback(filter),
        total: FALLBACK_PROPERTIES.length,
        isLive: false,
        source: 'fallback',
        error: err.message
      };
    }
  }

  // Fallback to high-quality curated collection
  return {
    properties: getFilteredFallback(filter),
    total: FALLBACK_PROPERTIES.length,
    isLive: false,
    source: 'fallback'
  };
}

/**
 * Fetch a single property by ID
 */
export async function fetchPropertyById(
  id: string,
  signal?: AbortSignal
): Promise<AtlasProperty | null> {
  // Try live API if configured and ID looks like an external or numeric ID
  if (isUnteraConfigured() && !id.startsWith('atlas-prop-')) {
    try {
      const raw = await getListing(id, signal);
      if (raw) return normalizeUnteraListing(raw);
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      console.warn('[ATLAS] Live property lookup failed for ID', id, err.message);
    }
  }

  // Check fallback dataset
  const fallback = FALLBACK_PROPERTIES.find(p => p.id === id);
  if (fallback) {
    return normalizeFallbackProperty(fallback);
  }

  return null;
}

/**
 * Helper to filter local fallback dataset
 */
function getFilteredFallback(filter: PropertyFilterState): AtlasProperty[] {
  return FALLBACK_PROPERTIES.filter(p => {
    if (filter.country && !p.country.toLowerCase().includes(filter.country.toLowerCase())) return false;
    if (filter.destinationId && p.destinationId !== filter.destinationId) return false;
    if (filter.propertyType && p.propertyType !== filter.propertyType) return false;
    if (filter.bedrooms && p.specs.bedrooms < parseInt(filter.bedrooms, 10)) return false;
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      const match = p.title.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.country.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  }).map(normalizeFallbackProperty);
}
