import { UnteraRawListing, UnteraSearchResponse, UnteraSingleListingResponse } from '@/types/property';
import { MarketScoresResponse, UnteraStats, UnteraSourcesResponse } from '@/types/market';

const UNTERA_BASE_URL = typeof window !== 'undefined' ? '/api/untera' : 'http://localhost:5173/api/untera';

/**
 * Indicates if the Untera service integration is enabled.
 * The API key is securely held server-side and never exposed to the client.
 */
export const isUnteraConfigured = (): boolean => true;

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
 * Low-level authenticated fetch to Atlas Untera proxy with cache and rate-limit safeguards.
 * Never connects directly to api.untera.io or exposes API keys in the browser.
 */
async function unteraFetch<T>(
  endpoint: string,
  params: Record<string, any> = {},
  signal?: AbortSignal
): Promise<T> {
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

  // Enforce burst rate-limit guard with gentle self-throttling wait
  if (!canMakeRequest()) {
    if (cached) {
      return cached.data as T;
    }
    const oldest = requestTimestamps[0] || 0;
    const waitTime = Math.min(Math.max(60000 - (Date.now() - oldest) + 100, 1000), 4000);
    await new Promise(r => setTimeout(r, waitTime));
    if (!canMakeRequest()) {
      throw new Error('RATE_LIMIT_BURST_PROTECTION');
    }
  }

  const url = `${UNTERA_BASE_URL}${endpoint}${sortedQuery ? `?${sortedQuery}` : ''}`;

  recordRequest();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    signal
  });

  if (!response.ok) {
    let errBody: any = null;
    try {
      errBody = await response.json();
    } catch {
      // Fallback if not JSON
    }

    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(errBody?.message || 'UNAUTHORIZED_API_KEY');
    }
    if (response.status === 503) {
      throw new Error(errBody?.message || 'UNTERA_API_KEY_NOT_CONFIGURED');
    }
    if (response.status === 502) {
      throw new Error(errBody?.message || 'UPSTREAM_GATEWAY_ERROR');
    }
    throw new Error(errBody?.message || `UNTERA_API_ERROR_${response.status}`);
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
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  minSqm?: number;
  maxSqm?: number;
  type?: string;
  transaction?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Search live listings across 80+ countries and 3.9M+ listings
 * Untera search endpoint: GET /listings/search
 */
export async function searchListings(
  params: UnteraSearchFilterParams = {},
  signal?: AbortSignal
): Promise<UnteraSearchResponse> {
  const pageSize = Math.min(Math.max(params.pageSize || 24, 1), 50);
  const cleanParams: Record<string, any> = {
    pageSize,
    page: params.page || 1
  };

  if (params.country) cleanParams.country = params.country;
  if (params.location) cleanParams.location = params.location;
  if (params.minPrice !== undefined && params.minPrice > 0) cleanParams.minPrice = params.minPrice;
  if (params.maxPrice !== undefined && params.maxPrice < 200000000) cleanParams.maxPrice = params.maxPrice;
  if (params.minBeds !== undefined && params.minBeds > 0) cleanParams.minBeds = params.minBeds;
  if (params.minBaths !== undefined && params.minBaths > 0) cleanParams.minBaths = params.minBaths;
  if (params.minSqm !== undefined && params.minSqm > 0) cleanParams.minSqm = params.minSqm;
  if (params.maxSqm !== undefined && params.maxSqm > 0) cleanParams.maxSqm = params.maxSqm;
  if (params.type && params.type !== 'all') cleanParams.type = params.type;
  if (params.transaction && params.transaction !== 'all') cleanParams.transaction = params.transaction;
  if (params.sort) cleanParams.sort = params.sort;

  return unteraFetch<UnteraSearchResponse>('/listings/search', cleanParams, signal);
}

/**
 * Retrieve single listing details by ID
 * Untera listing endpoint: GET /listings/{id}
 */
export async function getListing(
  id: string | number,
  signal?: AbortSignal
): Promise<UnteraRawListing> {
  const result = await unteraFetch<UnteraSingleListingResponse | any>(`/listings/${id}`, {}, signal);
  return result?.listing || result?.data || result;
}

/**
 * Retrieve global property market scores
 * Untera market endpoint: GET /market/scores
 */
export async function getMarketScores(signal?: AbortSignal): Promise<MarketScoresResponse> {
  return unteraFetch<MarketScoresResponse>('/market/scores', {}, signal);
}

/**
 * Retrieve platform global statistics
 * Untera stats endpoint: GET /stats
 */
export async function getStats(signal?: AbortSignal): Promise<UnteraStats> {
  return unteraFetch<UnteraStats>('/stats', {}, signal);
}

/**
 * Retrieve available property sources
 * Untera sources endpoint: GET /sources
 */
export async function getSources(signal?: AbortSignal): Promise<UnteraSourcesResponse> {
  return unteraFetch<UnteraSourcesResponse>('/sources', {}, signal);
}

