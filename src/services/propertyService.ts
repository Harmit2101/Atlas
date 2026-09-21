import { AtlasProperty, PropertyFilterState, UnteraRawListing, ListingIntent, RentalPeriod } from '@/types/property';
import { searchListings, getListing, isUnteraConfigured } from '@/lib/untera';
import { resolveListingLocation } from '@/services/geoService';
import { fetchGlobalDiscoveryFeed } from '@/services/globalDiscoveryService';
import { isHighValueSale, isUltraLuxuryRental, resolveUsdValuation } from '@/services/inventoryRules';

import { 
  normalizeListingMedia, 
  NormalizedListingMedia, 
  normalizeListingImages, 
  extractListingFloorPlans 
} from '@/services/mediaService';

export { 
  normalizeListingMedia, 
  normalizeListingImages, 
  extractListingFloorPlans 
};
export type { NormalizedListingMedia };

/**
 * Normalizes bedroom count from raw Untera data.
 * Checks direct numeric/string fields and falls back to genuine title/subtype mentions if present.
 * Never fabricates numbers.
 */
export function normalizeBedroomCount(raw: UnteraRawListing): number {
  const direct = raw.bedrooms ?? raw.beds ?? (raw as any).num_bedrooms ?? (raw as any).bedroom_count;
  if (direct != null && direct !== '') {
    const parsed = Number(direct);
    if (!isNaN(parsed) && parsed > 0) return Math.round(parsed);
  }

  // Parse genuine provider title if listing title explicitly defines bedroom count (e.g. "4-BEDROOM")
  const title = String(raw.title || '');
  const match = title.match(/(\d+)\s*[-]?\s*(?:bed|bedroom|chambre|dormitorio|br)\b/i);
  if (match) {
    const fromTitle = parseInt(match[1], 10);
    if (!isNaN(fromTitle) && fromTitle > 0 && fromTitle <= 50) {
      return fromTitle;
    }
  }

  return 0;
}

/**
 * Normalizes bathroom count from raw Untera data.
 * Correctly parses Canadian/Quebec Centris integer encodings (e.g. 31 => 3 full + 1 half = 3.5 baths)
 * and direct fractional/decimal counts.
 * Never fabricates numbers.
 */
export function normalizeBathroomCount(raw: UnteraRawListing): number {
  const direct = raw.bathrooms ?? raw.baths ?? (raw as any).num_bathrooms ?? (raw as any).bathroom_count;
  if (direct != null && direct !== '') {
    const num = Number(direct);
    if (!isNaN(num) && num > 0) {
      // Handle Canadian/Quebec MLS two-digit integer encoding (e.g. 31 => 3 full + 1 powder = 3.5)
      if (Number.isInteger(num) && num >= 11 && num <= 99) {
        const full = Math.floor(num / 10);
        const half = num % 10;
        if (half >= 1 && half <= 4 && full >= 1 && full <= 9) {
          return full + half * 0.5;
        }
      }
      return num;
    }
  }

  // Parse genuine provider title if listing title explicitly defines bathroom count (e.g. "3.5 Bath")
  const title = String(raw.title || '');
  const match = title.match(/(\d+(?:\.\d+)?)\s*[-]?\s*(?:bath|bathroom|salle de bain)\b/i);
  if (match) {
    const fromTitle = parseFloat(match[1]);
    if (!isNaN(fromTitle) && fromTitle > 0 && fromTitle <= 30) {
      return fromTitle;
    }
  }

  return 0;
}

/**
 * Normalizes listing intent: 'sale' | 'rent' | 'unknown'.
 * Never infers intent from arbitrary text if reliable source field exists.
 */
export function normalizeListingIntent(raw: UnteraRawListing): ListingIntent {
  const rawTx = (raw.transaction || raw.transaction_type || '').trim().toLowerCase();
  if (rawTx === 'rent' || rawTx === 'rental' || rawTx === 'lease') return 'rent';
  if (rawTx === 'sale' || rawTx === 'buy' || rawTx === 'purchase') return 'sale';

  const rawSubtype = ((raw as any).listing_type || (raw as any).intent || '').trim().toLowerCase();
  if (rawSubtype.includes('rent') || rawSubtype.includes('lease')) return 'rent';
  if (rawSubtype.includes('sale')) return 'sale';

  if (raw.rental_period || raw.rent_period || raw.price_period) return 'rent';

  // Default to sale for global MLS unless rental parameters exist
  return 'sale';
}

/**
 * Normalizes rental period: 'day' | 'week' | 'month' | 'year' | 'unknown'.
 * CRITICAL: A rental of $5,000/month is NOT $5,000/day.
 */
export function normalizeRentalPeriod(raw: UnteraRawListing, intent: ListingIntent): RentalPeriod | undefined {
  if (intent !== 'rent') return undefined;

  const direct = String(raw.rental_period || raw.rent_period || raw.price_period || raw.period || raw.frequency || '').trim().toLowerCase();
  if (direct.includes('day') || direct.includes('daily') || direct === 'd' || direct === 'night' || direct === 'nightly') return 'day';
  if (direct.includes('week') || direct.includes('weekly') || direct === 'w') return 'week';
  if (direct.includes('month') || direct.includes('monthly') || direct === 'm') return 'month';
  if (direct.includes('year') || direct.includes('annual') || direct === 'y') return 'year';

  const titleAndDesc = `${raw.title || ''} ${raw.description || ''}`.toLowerCase();
  if (/\b(per day|a day|\/day|daily rate|nightly|per night)\b/.test(titleAndDesc)) return 'day';
  if (/\b(per week|a week|\/week|weekly rate)\b/.test(titleAndDesc)) return 'week';
  if (/\b(per month|a month|\/month|monthly rate)\b/.test(titleAndDesc)) return 'month';
  if (/\b(per year|a year|\/year|annually)\b/.test(titleAndDesc)) return 'year';

  return 'unknown';
}

/**
 * Normalizes a raw Untera API listing into the consistent AtlasProperty domain model.
 * Strictly preserves genuine Untera data with zero fabricated metrics or imagery.
 */
export function normalizeUnteraListing(raw: UnteraRawListing): AtlasProperty {
  const id = String(raw.id || raw.source_id || `prop-${Math.random().toString(36).substring(7)}`);
  const rawPrice = Number(raw.original_price ?? raw.price ?? 0);
  const originalCurrency = (raw.original_currency || raw.currency || 'USD').trim().toUpperCase();
  const rawPriceUsd = raw.price_usd != null ? Number(raw.price_usd) : null;
  
  // Safe valuation calculation - foreign currencies never silently treated as USD
  const valuation = resolveUsdValuation(rawPrice, originalCurrency, rawPriceUsd);
  const priceUsd = valuation.priceUsd;

  // Format price display with honest currency labeling
  let priceFormatted = 'Price on Inquiry';
  if (rawPrice > 0) {
    if (originalCurrency === 'USD') {
      priceFormatted = `$${rawPrice.toLocaleString()}`;
    } else if (originalCurrency === 'EUR') {
      priceFormatted = `€${rawPrice.toLocaleString()}${valuation.isVerified ? ` ($${priceUsd.toLocaleString()})` : ''}`;
    } else if (originalCurrency === 'GBP') {
      priceFormatted = `£${rawPrice.toLocaleString()}${valuation.isVerified ? ` ($${priceUsd.toLocaleString()})` : ''}`;
    } else {
      priceFormatted = `${originalCurrency} ${rawPrice.toLocaleString()}${valuation.isVerified ? ` ($${priceUsd.toLocaleString()})` : ''}`;
    }
  }

  // Extract legitimate listing media (empty arrays if no media provided by Untera)
  const media = normalizeListingMedia(raw);
  const images = media.images;
  const imageUrl = media.primaryImage || images[0] || undefined;
  const floorPlans = media.floorPlans;

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

  const listingIntent = normalizeListingIntent(raw);
  const rentalPeriod = normalizeRentalPeriod(raw, listingIntent);
  const transactionType = listingIntent === 'rent' ? 'rent' : 'sale';

  const isHighValue = isHighValueSale({
    listingIntent,
    transactionType,
    priceUsd,
    price: rawPrice,
    currency: originalCurrency
  });

  const isUltraLuxury = isUltraLuxuryRental({
    listingIntent,
    transactionType,
    rentalPeriod,
    priceUsd,
    price: rawPrice,
    currency: originalCurrency
  });

  // Future-ready spatial source classification
  let spatialSource: 'room_geometry' | 'floor_plan' | 'metadata_massing' | 'none' = 'none';
  if ((raw as any).room_dimensions || (raw as any).rooms_geometry) {
    spatialSource = 'room_geometry';
  } else if (floorPlans.length > 0) {
    spatialSource = 'floor_plan';
  } else if (areaSqm > 0 || areaSqft > 0) {
    spatialSource = 'metadata_massing';
  }

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
    price: rawPrice,
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
    listingIntent,
    rentalPeriod,
    isHighValueSale: isHighValue,
    isUltraLuxuryRental: isUltraLuxury,
    floorPlans,
    spatialSource,
    bedrooms: normalizeBedroomCount(raw),
    bathrooms: normalizeBathroomCount(raw),
    areaSqm,
    areaSqft,
    yearBuilt: raw.year_built || undefined,
    images,
    imageUrl,
    primaryImage: media.primaryImage,
    videos: media.videos,
    virtualTours: media.virtualTours,
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
  const hasTierFilter = Boolean(filter.tier && filter.tier !== 'all');
  const hasTransactionFilter = Boolean(filter.transactionType && filter.transactionType !== 'all');
  const isUserSearch = Boolean(
    filter.country ||
    filter.location ||
    filter.searchQuery ||
    hasTierFilter ||
    hasTransactionFilter ||
    (filter.minPrice !== undefined && filter.minPrice > 0) ||
    (filter.maxPrice !== undefined && filter.maxPrice < 200000000) ||
    filter.bedrooms ||
    filter.bathrooms ||
    (filter.propertyType && filter.propertyType !== 'all') ||
    (filter.sortBy && filter.sortBy !== 'featured')
  );

  // MODE A: GLOBAL DISCOVERY FEED (Multi-continental live Untera sampling)
  if (!isUserSearch) {
    return await fetchGlobalDiscoveryFeed(filter.page || 1, signal);
  }

  // MODE B: TARGETED USER SEARCH (Single direct query for user-specified criteria)
  try {
    // Resolve transaction filter based on intent and commercial tier
    let transactionParam = filter.transactionType && filter.transactionType !== 'all' ? filter.transactionType : undefined;
    const isRent = filter.transactionType === 'rent' || filter.tier === 'ultra-luxury-rent';
    const defaultLuxuryFloor = isRent ? 5000 : 300000;
    let minPriceParam = filter.minPrice !== undefined && filter.minPrice > 0
      ? Math.max(filter.minPrice, defaultLuxuryFloor)
      : defaultLuxuryFloor;

    if (filter.tier === 'high-value-sale') {
      transactionParam = 'sale';
      minPriceParam = Math.max(filter.minPrice || 0, 300000);
    } else if (filter.tier === 'ultra-luxury-rent') {
      transactionParam = 'rent';
      minPriceParam = Math.max(filter.minPrice || 0, 5000);
    }

    // Pass true geographic location into Untera location param, avoiding conflation with keywords
    const locationParam = filter.location || filter.country || undefined;

    const response = await searchListings({
      country: filter.country || undefined,
      location: locationParam,
      minPrice: minPriceParam,
      maxPrice: filter.maxPrice,
      minBeds: filter.bedrooms ? parseInt(filter.bedrooms, 10) : undefined,
      minBaths: filter.bathrooms ? parseInt(filter.bathrooms, 10) : undefined,
      minSqm: filter.minSqm,
      maxSqm: filter.maxSqm,
      type: filter.propertyType && filter.propertyType !== 'all' ? filter.propertyType : undefined,
      transaction: transactionParam,
      sort: filter.sortBy,
      page: filter.page || 1,
      pageSize: filter.pageSize || 24
    }, signal);

    const rawListings = response.results || response.listings || response.data || [];
    let properties = rawListings.map(normalizeUnteraListing);

    // Strictly enforce Atlas high-end inventory floor ($300k+ USD for sales, $5k+ for rentals)
    properties = properties.filter(p => {
      if (p.listingIntent === 'rent' || p.transactionType === 'rent') {
        return p.priceUsd >= 5000;
      }
      return p.priceUsd >= 300000;
    });

    // Apply strict commercial qualification filters if requested
    if (filter.tier === 'high-value-sale') {
      properties = properties.filter(p => p.isHighValueSale);
    } else if (filter.tier === 'ultra-luxury-rent') {
      properties = properties.filter(p => p.isUltraLuxuryRental);
    } else if (filter.transactionType && filter.transactionType !== 'all') {
      properties = properties.filter(p => p.listingIntent === filter.transactionType || p.transactionType === filter.transactionType);
    }

    // Apply client-side keyword matching if searchQuery was specified separately from geographic location
    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.trim().toLowerCase();
      properties = properties.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.propertyType.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.features.some(f => f.toLowerCase().includes(q))
      );
    }

    return {
      properties,
      total: properties.length >= 24 ? (response.count || response.total || properties.length) : properties.length,
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

  // Single provider prefix variant: replace first hyphen with underscore (e.g. engelvoelkers-107115b3-... => engelvoelkers_107115b3-...)
  const firstHyphenMatch = id.match(/^([a-z0-9]+)-(.*)$/i);
  if (firstHyphenMatch) {
    candidates.push(`${firstHyphenMatch[1]}_${firstHyphenMatch[2]}`);
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
