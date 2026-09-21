import { UnteraRawListing } from '@/types/property';
import { ImageFailureType } from './imageConcurrencyService';

export interface MediaCandidate {
  url: string;
  sourceField: string;
  sourceIndex: number;
  sourceProvider?: string;
}

export interface NormalizedListingMedia {
  images: string[];
  primaryImage: string | null;
  candidates: MediaCandidate[];
  floorPlans: string[];
  videos: string[];
  virtualTours: string[];
}

export interface BrokenUrlRecord {
  url: string;
  failureType: ImageFailureType;
  timestamp: number;
}

export interface MediaValidationResult {
  valid: boolean;
  status: number;
  failureType?: ImageFailureType;
  reason?: string;
}

/**
 * Global bounded session registry of verified broken image URLs (e.g. 404s, CONNECTION_RESET).
 * Prevents redundant browser network requests for known-failed URLs during the current session.
 * Exact URL-based only: never permanently blacklists entire CDN domains.
 */
const MAX_BROKEN_URLS = 1000;
const brokenImageRegistry = new Map<string, BrokenUrlRecord>();

export function markImageUrlBroken(
  url: string, 
  failureType: ImageFailureType = 'IMAGE_UNKNOWN'
): void {
  if (!url) return;
  if (brokenImageRegistry.size >= MAX_BROKEN_URLS) {
    const firstKey = brokenImageRegistry.keys().next().value;
    if (firstKey) brokenImageRegistry.delete(firstKey);
  }
  brokenImageRegistry.set(url, {
    url,
    failureType,
    timestamp: Date.now()
  });
}

export function isImageUrlBroken(url: string): boolean {
  if (!url) return true;
  return brokenImageRegistry.has(url);
}

export function getImageUrlFailureType(url: string): ImageFailureType | undefined {
  return brokenImageRegistry.get(url)?.failureType;
}

export function filterBrokenImages(urls: string[]): string[] {
  return urls.filter(url => Boolean(url) && !brokenImageRegistry.has(url));
}

export function clearBrokenImageRegistry(): void {
  brokenImageRegistry.clear();
}

/**
 * Domain reliability policy & client-side validation cache (Phase 4).
 * Distinguishes:
 * - exact URL failure (404/reset) -> skip immediately
 * - domain behavior -> pre-validate candidate before browser rendering
 */
const clientValidationCache = new Map<string, { result: MediaValidationResult; timestamp: number }>();
const CLIENT_CACHE_TTL_MS = 15 * 60 * 1000;
const inflightClientProbes = new Map<string, Promise<MediaValidationResult>>();

const domainFailureCounts = new Map<string, number>();

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function isSuspectDomain(url: string): boolean {
  if (!url) return false;
  const domain = extractDomain(url);
  if (!domain) return false;

  if (
    domain.includes('staticbm.com') ||
    domain.includes('staticmb.com') ||
    domain.includes('homes.jp') ||
    domain.includes('homes.co.jp')
  ) {
    return true;
  }

  const failures = domainFailureCounts.get(domain) || 0;
  return failures >= 2;
}

export function isReliableDomain(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/images') || url.startsWith('/api')) return true;
  const domain = extractDomain(url);
  return (
    domain === 'api.untera.io' ||
    domain.endsWith('.untera.io') ||
    domain.includes('unsplash.com') ||
    domain.includes('uploadcare.engelvoelkers.com') ||
    domain.includes('drivenproperties.com') ||
    domain.includes('media.onthemarket.com') ||
    domain.includes('cdn-redfin.com')
  );
}

export function recordDomainFailure(url: string): void {
  const domain = extractDomain(url);
  if (!domain) return;
  const curr = domainFailureCounts.get(domain) || 0;
  domainFailureCounts.set(domain, curr + 1);
}

/**
 * Server-side media validation mechanism (Phase 2 & Phase 3).
 * Probes the candidate via /api/media/validate before rendering <img src>.
 * Returns validation status without the browser ever requesting a broken asset directly.
 */
export async function validateCandidateUrlServerSide(url: string): Promise<MediaValidationResult> {
  if (!url) {
    return { valid: false, status: 400, reason: 'EMPTY_URL', failureType: 'IMAGE_UNKNOWN' };
  }

  // Exact URL known broken in session registry
  if (isImageUrlBroken(url)) {
    return {
      valid: false,
      status: 404,
      failureType: getImageUrlFailureType(url) || 'IMAGE_404',
      reason: 'KNOWN_BROKEN'
    };
  }

  // Check client cache
  const cached = clientValidationCache.get(url);
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
    return cached.result;
  }

  // Deduplicate in-flight requests for the same URL
  let inflight = inflightClientProbes.get(url);
  if (!inflight) {
    inflight = (async () => {
      try {
        const endpoint = `/api/media/validate?url=${encodeURIComponent(url)}`;
        const res = await fetch(endpoint, { method: 'GET' });
        const data = await res.json();

        let failureType: ImageFailureType | undefined = undefined;
        if (!data.valid) {
          if (data.reason === '404' || data.status === 404) {
            failureType = 'IMAGE_404';
          } else if (data.reason === 'TIMEOUT' || data.status === 408) {
            failureType = 'IMAGE_TIMEOUT';
          } else if (data.reason === 'CONNECTION_RESET' || data.status === 502) {
            failureType = 'IMAGE_CONNECTION_RESET';
          } else {
            failureType = 'IMAGE_UNKNOWN';
          }
          markImageUrlBroken(url, failureType);
          recordDomainFailure(url);
        }

        const result: MediaValidationResult = {
          valid: Boolean(data.valid),
          status: data.status || (data.valid ? 200 : 500),
          failureType,
          reason: data.reason
        };

        clientValidationCache.set(url, { result, timestamp: Date.now() });
        return result;
      } catch (err: any) {
        const failureType: ImageFailureType = url.includes('homes.jp') ? 'IMAGE_CONNECTION_RESET' : 'IMAGE_UNKNOWN';
        markImageUrlBroken(url, failureType);
        recordDomainFailure(url);
        const result: MediaValidationResult = {
          valid: false,
          status: 500,
          failureType,
          reason: err.message
        };
        clientValidationCache.set(url, { result, timestamp: Date.now() });
        return result;
      } finally {
        inflightClientProbes.delete(url);
      }
    })();

    inflightClientProbes.set(url, inflight);
  }

  return inflight;
}

/**
 * Diagnostic logger active strictly when localStorage.getItem('atlas_debug') === '1' (Phase 14).
 * Keeps routine browser console completely clean.
 */
function isAtlasDebugEnabled(): boolean {
  return typeof window !== 'undefined' && window.localStorage?.getItem('atlas_debug') === '1';
}

const loggedProperties = new Set<string>();

export interface PropertyMediaDiagnosticPayload {
  propertyId: string;
  primaryFailedUrl?: string;
  primaryFailureType?: ImageFailureType;
  fallbackIndex?: number;
  exhausted?: boolean;
  sourceProvider?: string;
}

export function logPropertyMediaDiagnostic(payload: PropertyMediaDiagnosticPayload): void {
  if (!isAtlasDebugEnabled()) return;
  const { propertyId, primaryFailureType = 'IMAGE_UNKNOWN', fallbackIndex, exhausted, sourceProvider } = payload;
  if (!propertyId || loggedProperties.has(propertyId)) return;

  loggedProperties.add(propertyId);

  const cleanFailure = primaryFailureType.replace('IMAGE_', '');
  const providerText = sourceProvider ? ` [${sourceProvider}]` : '';

  if (exhausted) {
    console.info(
      `[Atlas Media] Property [${propertyId}]${providerText}: all candidates failed (${cleanFailure}) — showing honest unavailable state`
    );
  } else if (fallbackIndex !== undefined) {
    console.debug(
      `[Atlas Media] Property [${propertyId}]${providerText}: primary image failed: ${cleanFailure}; fallback succeeded: candidate ${fallbackIndex + 1}`
    );
  }
}

export function logMediaDiagnostic(
  type: 'failed' | 'fallback' | 'exhausted',
  propertyId: string,
  url?: string
): void {
  logPropertyMediaDiagnostic({
    propertyId,
    primaryFailedUrl: url,
    primaryFailureType: url?.includes('homes.jp') ? 'IMAGE_CONNECTION_RESET' : 'IMAGE_UNKNOWN',
    fallbackIndex: type === 'fallback' ? 1 : undefined,
    exhausted: type === 'exhausted'
  });
}

/**
 * Extracts and normalizes floor-plan images if provided by the source listing.
 * Strictly avoids fabricating floor plans if none are provided.
 */
export function extractListingFloorPlans(raw: UnteraRawListing, images: string[]): string[] {
  const candidates: any[] = [];
  if (Array.isArray(raw.floor_plans)) candidates.push(...raw.floor_plans);
  if (Array.isArray(raw.floorplans)) candidates.push(...raw.floorplans);
  if (typeof raw.floor_plan === 'string') candidates.push(raw.floor_plan);
  if (typeof raw.floorplan === 'string') candidates.push(raw.floorplan);
  if (typeof (raw as any).blueprint === 'string') candidates.push((raw as any).blueprint);

  const floorPlans: string[] = [];
  const seen = new Set<string>();

  for (const item of candidates) {
    const url = typeof item === 'string' ? item.trim() : (item?.url || '').trim();
    if (!url) continue;
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = url.startsWith('/') ? `https://api.untera.io${url}` : `https://api.untera.io/${url}`;
    }
    if (!seen.has(fullUrl)) {
      seen.add(fullUrl);
      floorPlans.push(fullUrl);
    }
  }

  const FLOOR_PLAN_REGEX = /(?:floor[-_]?plan|blueprint|cad[-_]?schematic|architectural[-_]?layout|grundriss|plan[-_]?niveau)/i;
  const PHOTO_REJECT_REGEX = /(?:window|ceiling|balcony|terrace|facade|living|kitchen|bath|bedroom|garden|pool|exterior|interior|view)/i;

  for (const img of images) {
    const filename = img.split('/').pop()?.split('?')[0] || img;
    if (FLOOR_PLAN_REGEX.test(filename) && !PHOTO_REJECT_REGEX.test(filename)) {
      if (!seen.has(img)) {
        seen.add(img);
        floorPlans.push(img);
      }
    }
  }

  return floorPlans;
}

/**
 * Single source of truth for extracting and normalizing all listing media from Untera.
 * Extracts genuine photos, primary images, floor plans, videos, and virtual tours.
 * Preserves source image order, resolves relative paths, removes duplicates,
 * and prioritizes verified reliable candidates ahead of suspect CDN domains (Phase 6 & 7).
 */
export function normalizeListingMedia(raw: UnteraRawListing): NormalizedListingMedia {
  const rawCandidateItems: Array<{ val: any; field: string }> = [];

  // Primary image fields first if explicitly defined by source
  if (typeof (raw as any).primary_image === 'string') rawCandidateItems.push({ val: (raw as any).primary_image, field: 'primary_image' });
  if (typeof (raw as any).primaryImage === 'string') rawCandidateItems.push({ val: (raw as any).primaryImage, field: 'primaryImage' });

  // Arrays of images/photos
  if (Array.isArray(raw.images)) raw.images.forEach((x, idx) => rawCandidateItems.push({ val: x, field: `images[${idx}]` }));
  if (Array.isArray(raw.photos)) raw.photos.forEach((x, idx) => rawCandidateItems.push({ val: x, field: `photos[${idx}]` }));
  if (Array.isArray((raw as any).media)) {
    (raw as any).media.forEach((m: any, idx: number) => {
      if (typeof m === 'string') rawCandidateItems.push({ val: m, field: `media[${idx}]` });
      else if (m?.url) rawCandidateItems.push({ val: m.url, field: `media[${idx}].url` });
      else if (m?.image_url) rawCandidateItems.push({ val: m.image_url, field: `media[${idx}].image_url` });
    });
  }
  if (Array.isArray((raw as any).gallery)) {
    (raw as any).gallery.forEach((x: any, idx: number) => rawCandidateItems.push({ val: x, field: `gallery[${idx}]` }));
  }

  // Single string fallbacks from various MLS conventions
  if (typeof (raw as any).thumbnail === 'string') rawCandidateItems.push({ val: (raw as any).thumbnail, field: 'thumbnail' });
  if (typeof (raw as any).image === 'string') rawCandidateItems.push({ val: (raw as any).image, field: 'image' });
  if (typeof (raw as any).photo === 'string') rawCandidateItems.push({ val: (raw as any).photo, field: 'photo' });
  if (typeof (raw as any).image_url === 'string') rawCandidateItems.push({ val: (raw as any).image_url, field: 'image_url' });
  if (typeof (raw as any).imageUrl === 'string') rawCandidateItems.push({ val: (raw as any).imageUrl, field: 'imageUrl' });

  const rawCandidates: MediaCandidate[] = [];
  const seen = new Set<string>();
  const sourceProvider = raw.source || raw.source_name || undefined;

  for (let idx = 0; idx < rawCandidateItems.length; idx++) {
    const item = rawCandidateItems[idx];
    if (!item.val) continue;
    const rawStr = typeof item.val === 'string' ? item.val.trim() : (item.val.url || item.val.href || '').trim();
    if (!rawStr) continue;

    let url: string;
    if (rawStr.startsWith('http://') || rawStr.startsWith('https://')) {
      url = rawStr;
    } else if (rawStr.startsWith('//')) {
      url = `https:${rawStr}`;
    } else if (rawStr.startsWith('/')) {
      url = `https://api.untera.io${rawStr}`;
    } else if (
      rawStr.startsWith('img.') || 
      rawStr.startsWith('cdn.') || 
      rawStr.startsWith('static.') || 
      rawStr.startsWith('www.')
    ) {
      url = `https://${rawStr}`;
    } else {
      url = `https://api.untera.io/${rawStr}`;
    }

    if (!seen.has(url)) {
      seen.add(url);
      rawCandidates.push({
        url,
        sourceField: item.field,
        sourceIndex: idx,
        sourceProvider
      });
    }
  }

  // Prioritize reliable candidate sources ahead of suspect CDN domains (Phase 6 & Phase 7)
  const reliableCandidates: MediaCandidate[] = [];
  const suspectCandidates: MediaCandidate[] = [];
  for (const c of rawCandidates) {
    if (isSuspectDomain(c.url)) {
      suspectCandidates.push(c);
    } else {
      reliableCandidates.push(c);
    }
  }

  // Phase 6 & Phase 7: Discard suspect CDN domains if reliable source candidates exist
  const candidates = reliableCandidates.length > 0
    ? reliableCandidates
    : suspectCandidates;
  const images = candidates.map(c => c.url);

  // Videos and Virtual Tours
  const videos: string[] = [];
  const virtualTours: string[] = [];
  if (Array.isArray((raw as any).videos)) {
    (raw as any).videos.forEach((v: any) => {
      const vUrl = typeof v === 'string' ? v.trim() : v?.url?.trim();
      if (vUrl && !videos.includes(vUrl)) videos.push(vUrl);
    });
  }
  if (Array.isArray((raw as any).virtual_tours)) {
    (raw as any).virtual_tours.forEach((vt: any) => {
      const vtUrl = typeof vt === 'string' ? vt.trim() : vt?.url?.trim();
      if (vtUrl && !virtualTours.includes(vtUrl)) virtualTours.push(vtUrl);
    });
  }
  if (typeof (raw as any).virtual_tour === 'string') {
    const vt = (raw as any).virtual_tour.trim();
    if (vt && !virtualTours.includes(vt)) virtualTours.push(vt);
  }
  if (typeof (raw as any).virtualTour === 'string') {
    const vt = (raw as any).virtualTour.trim();
    if (vt && !virtualTours.includes(vt)) virtualTours.push(vt);
  }

  const floorPlans = extractListingFloorPlans(raw, images);
  const primaryImage = images.length > 0 ? images[0] : null;

  return {
    images,
    primaryImage,
    candidates,
    floorPlans,
    videos,
    virtualTours
  };
}

/**
 * Resolves full, valid image URLs strictly from the listing's actual data.
 * Wraps normalizeListingMedia for backwards compatibility.
 */
export function normalizeListingImages(raw: UnteraRawListing): string[] {
  return normalizeListingMedia(raw).images;
}
