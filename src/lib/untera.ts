import { UnteraRawListing, UnteraSearchResponse } from '@/types/property';

const UNTERA_BASE_URL = 'https://api.untera.io/api/v1';

// Read API Key securely from environment
const getApiKey = (): string | undefined => {
  return import.meta.env.VITE_UNTERA_API_KEY;
};

export const isUnteraConfigured = (): boolean => {
  const key = getApiKey();
  return Boolean(key && !key.includes('your_untera_api_key'));
};

// In-memory cache with 15-minute TTL to shield free-tier quota (1,000 req/day)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Rate limiter safety: tracking requests per minute window (max 15/min burst)
const requestTimestamps: number[] = [];
const MAX_BURST_PER_MINUTE = 14;

function canMakeRequest(): boolean {
  const now = Date.now();
  // Filter out timestamps older than 60 seconds
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 60000) {
    requestTimestamps.shift();
  }
  return requestTimestamps.length < MAX_BURST_PER_MINUTE;
}

function recordRequest(): void {
  requestTimestamps.push(Date.now());
}

/**
 * Low-level authenticated fetch to Untera API with cache and rate-limit safeguards.
 */
async function unteraFetch<T>(
  endpoint: string,
  params: Record<string, any> = {},
  signal?: AbortSignal
): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey || !isUnteraConfigured()) {
    throw new Error('UNTERA_API_KEY_NOT_CONFIGURED');
  }

  // Construct cache key from endpoint and sorted params
  const sortedQuery = Object.keys(params)
    .sort()
    .filter(k => params[k] !== undefined && params[k] !== '')
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
  
  const cacheKey = `${endpoint}?${sortedQuery}`;

  // Check cache
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  // Enforce burst rate-limit guard
  if (!canMakeRequest()) {
    // If cached stale data exists, return it instead of throwing
    if (cached) {
      return cached.data as T;
    }
    throw new Error('RATE_LIMIT_BURST_PROTECTION');
  }

  const url = `${UNTERA_BASE_URL}${endpoint}${sortedQuery ? `?${sortedQuery}` : ''}`;

  recordRequest();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-API-Key': apiKey
    },
    signal
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('UNAUTHORIZED_API_KEY');
    }
    throw new Error(`UNTERA_API_ERROR_${response.status}: ${errorText.slice(0, 100)}`);
  }

  const data = await response.json();

  // Cache successful response
  memoryCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  return data as T;
}

export interface UnteraSearchFilterParams {
  country?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  property_type?: string;
  transaction_type?: string;
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

/**
 * Search live listings across 80+ countries and 3.6M+ listings
 */
export async function searchListings(
  params: UnteraSearchFilterParams = {},
  signal?: AbortSignal
): Promise<UnteraSearchResponse> {
  const cleanParams: Record<string, any> = {
    limit: params.limit || 24,
    page: params.page || 1
  };

  if (params.country) cleanParams.country = params.country;
  if (params.city) cleanParams.city = params.city;
  if (params.min_price) cleanParams.min_price = params.min_price;
  if (params.max_price) cleanParams.max_price = params.max_price;
  if (params.bedrooms) cleanParams.bedrooms = params.bedrooms;
  if (params.bathrooms) cleanParams.bathrooms = params.bathrooms;
  if (params.property_type) cleanParams.property_type = params.property_type;
  if (params.transaction_type) cleanParams.transaction_type = params.transaction_type;
  if (params.q) cleanParams.q = params.q;
  if (params.sort) cleanParams.sort = params.sort;

  return unteraFetch<UnteraSearchResponse>('/listings', cleanParams, signal);
}

/**
 * Retrieve single listing details by ID
 */
export async function getListing(
  id: string | number,
  signal?: AbortSignal
): Promise<UnteraRawListing> {
  const result = await unteraFetch<any>(`/listings/${id}`, {}, signal);
  return result?.data || result;
}

/**
 * Retrieve available property sources
 */
export async function getSources(signal?: AbortSignal): Promise<any> {
  return unteraFetch<any>('/sources', {}, signal);
}

/**
 * Retrieve market scores
 */
export async function getMarketScores(signal?: AbortSignal): Promise<any> {
  return unteraFetch<any>('/market-scores', {}, signal);
}

/**
 * Retrieve platform stats
 */
export async function getStats(signal?: AbortSignal): Promise<any> {
  return unteraFetch<any>('/stats', {}, signal);
}
