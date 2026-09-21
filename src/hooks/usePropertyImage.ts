import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  isImageUrlBroken, 
  markImageUrlBroken, 
  logPropertyMediaDiagnostic, 
  getImageUrlFailureType,
  isSuspectDomain,
  validateCandidateUrlServerSide 
} from '@/services/mediaService';
import { ImageFailureType } from '@/services/imageConcurrencyService';

export interface UsePropertyImageOptions {
  propertyId: string;
  candidateUrls: string[];
  initialIndex?: number;
  sourceProvider?: string;
  isHero?: boolean;
}

export interface UsePropertyImageResult {
  currentUrl: string | null;
  imageLoaded: boolean;
  imageError: boolean;
  hasValidImage: boolean;
  imgRef: React.RefObject<HTMLImageElement | null>;
  handleLoad: () => void;
  handleError: (e?: any) => void;
  candidateCount: number;
  candidateIndex: number;
  setCandidateIndex: (index: number) => void;
  selectCandidate: (index: number) => void;
  failureType?: ImageFailureType;
}

const IMAGE_WATCHDOG_TIMEOUT_MS = 6000; // 6s fast-fallback for hanging CDN sockets (e.g. img.homes.jp)

/**
 * Robust, shared image loader honoring Atlas media reliability guidelines:
 * - Deterministic reset on propertyId change (zero state leakage between list items or page navigations).
 * - Pre-validation pipeline: Suspect CDN domains (staticbm/homes.jp) are validated server-side BEFORE rendering into <img src>.
 * - Zero browser 404 spam: Known-dead URLs are skipped before assigning to DOM src.
 * - Sequential candidate fallback (candidate 1 -> candidate 2 -> candidate 3 ... never parallel).
 * - Fast-fail timeout watchdog: immediately abandons hanging third-party CDN connections.
 * - Automatic cached-image detection (fixes invisible images when browser cache skips onLoad).
 * - Immediate dead image detection (handles complete === true && naturalWidth === 0).
 * - Bounded session-broken URL registry integration (never calls a dead/reset URL again).
 * - Honest unavailable state: If all candidates fail, cleanly renders luxury unavailable badge.
 */
export function usePropertyImage({
  propertyId,
  candidateUrls,
  initialIndex = 0,
  sourceProvider,
  isHero = false
}: UsePropertyImageOptions): UsePropertyImageResult {
  const [candidateIndex, setCandidateIndex] = useState(initialIndex);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [lastFailureType, setLastFailureType] = useState<ImageFailureType | undefined>(undefined);
  const [verifiedUrl, setVerifiedUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter out any URLs already verified as broken in the session registry
  const validCandidates = useMemo(() => {
    return candidateUrls.filter(url => Boolean(url) && !isImageUrlBroken(url));
  }, [candidateUrls]);

  const consecutiveSuspectFailuresRef = useRef(0);

  // Strict deterministic reset when property changes
  useEffect(() => {
    setCandidateIndex(initialIndex);
    setImageLoaded(false);
    setImageError(false);
    setLastFailureType(undefined);
    setVerifiedUrl(null);
    consecutiveSuspectFailuresRef.current = 0;
  }, [propertyId, initialIndex]);

  // Candidate validation pipeline (Phases 1, 2, 3, 4, 6, 7)
  // Ensures suspect URLs are validated before being exposed as currentUrl to <img src>
  useEffect(() => {
    if (candidateIndex >= validCandidates.length) {
      setVerifiedUrl(null);
      setImageError(true);
      return;
    }

    const targetCandidate = validCandidates[candidateIndex];
    if (!targetCandidate) {
      setVerifiedUrl(null);
      setImageError(true);
      return;
    }

    // If known broken in registry, advance immediately
    if (isImageUrlBroken(targetCandidate)) {
      setCandidateIndex(prev => prev + 1);
      return;
    }

    // If candidate is from a reliable domain (e.g. api.untera.io) or not suspect, render immediately
    if (!isSuspectDomain(targetCandidate)) {
      consecutiveSuspectFailuresRef.current = 0;
      setVerifiedUrl(targetCandidate);
      setImageError(false);
      return;
    }

    // Phase 3: Bounded probe guard. If 3 candidates from suspect domain already failed,
    // look for a non-suspect candidate or terminate immediately (do not probe 10-20 dead URLs).
    if (consecutiveSuspectFailuresRef.current >= 3) {
      const nextReliableIndex = validCandidates.findIndex(
        (c, idx) => idx > candidateIndex && !isSuspectDomain(c) && !isImageUrlBroken(c)
      );
      if (nextReliableIndex !== -1) {
        setCandidateIndex(nextReliableIndex);
      } else {
        setVerifiedUrl(null);
        setImageError(true);
      }
      return;
    }

    // Suspect domain (staticbm.com, staticmb.com, homes.jp): validate server-side before DOM render
    let cancelled = false;

    validateCandidateUrlServerSide(targetCandidate).then(res => {
      if (cancelled) return;
      if (res.valid) {
        consecutiveSuspectFailuresRef.current = 0;
        setVerifiedUrl(targetCandidate);
        setImageError(false);
      } else {
        consecutiveSuspectFailuresRef.current += 1;
        setLastFailureType(res.failureType || 'IMAGE_404');
        logPropertyMediaDiagnostic({
          propertyId,
          primaryFailedUrl: targetCandidate,
          primaryFailureType: res.failureType || 'IMAGE_404',
          fallbackIndex: candidateIndex + 1 < validCandidates.length ? candidateIndex + 1 : undefined,
          exhausted: candidateIndex + 1 >= validCandidates.length,
          sourceProvider
        });
        // Move sequentially to next candidate
        setCandidateIndex(prev => prev + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [candidateIndex, validCandidates, propertyId, sourceProvider]);

  const currentUrl = verifiedUrl;
  const hasValidImage = Boolean(currentUrl) && !imageError;

  const clearWatchdog = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  const handleLoad = useCallback(() => {
    clearWatchdog();
    setImageLoaded(true);
    setImageError(false);
  }, [clearWatchdog]);

  const handleError = useCallback((e?: any) => {
    clearWatchdog();

    let failureType: ImageFailureType = 'IMAGE_UNKNOWN';
    if (currentUrl) {
      if (currentUrl.includes('homes.jp')) {
        failureType = 'IMAGE_CONNECTION_RESET';
      } else if (e?.type === 'timeout') {
        failureType = 'IMAGE_TIMEOUT';
      }
      markImageUrlBroken(currentUrl, failureType);
    }
    setLastFailureType(failureType);
    setVerifiedUrl(null);

    // Step to subsequent candidate sequentially if available
    if (candidateIndex + 1 < validCandidates.length) {
      logPropertyMediaDiagnostic({
        propertyId,
        primaryFailedUrl: currentUrl || undefined,
        primaryFailureType: failureType,
        fallbackIndex: candidateIndex + 1,
        exhausted: false,
        sourceProvider
      });
      setCandidateIndex(prev => prev + 1);
      setImageLoaded(false);
      setImageError(false);
    } else {
      logPropertyMediaDiagnostic({
        propertyId,
        primaryFailedUrl: currentUrl || undefined,
        primaryFailureType: failureType,
        exhausted: true,
        sourceProvider
      });
      setImageError(true);
      setImageLoaded(false);
    }
  }, [clearWatchdog, currentUrl, candidateIndex, validCandidates.length, propertyId, sourceProvider]);

  // Watchdog timer: if current image URL does not load or error within timeout, trigger fallback
  useEffect(() => {
    clearWatchdog();
    if (!currentUrl || imageLoaded || imageError) return;

    watchdogTimerRef.current = setTimeout(() => {
      const img = imgRef.current;
      if (!img || (!img.complete && !imageLoaded)) {
        handleError({ type: 'timeout' });
      }
    }, IMAGE_WATCHDOG_TIMEOUT_MS);

    return () => {
      clearWatchdog();
    };
  }, [currentUrl, imageLoaded, imageError, handleError, clearWatchdog]);

  // Handle cached image race condition: if image is already complete in DOM, update state immediately
  useEffect(() => {
    if (!currentUrl) {
      setImageLoaded(false);
      return;
    }

    const img = imgRef.current;
    if (img && img.complete) {
      if (img.naturalWidth > 0) {
        clearWatchdog();
        setImageLoaded(true);
      } else if (img.naturalWidth === 0) {
        // Image completed with 0 dimensions => browser failed to load
        handleError();
      }
    }
  }, [currentUrl, handleError, clearWatchdog]);

  const selectCandidate = useCallback((index: number) => {
    if (index >= 0 && index < validCandidates.length) {
      clearWatchdog();
      setCandidateIndex(index);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [validCandidates.length, clearWatchdog]);

  return {
    currentUrl,
    imageLoaded,
    imageError,
    hasValidImage,
    imgRef,
    handleLoad,
    handleError,
    candidateCount: validCandidates.length,
    candidateIndex,
    setCandidateIndex,
    selectCandidate,
    failureType: lastFailureType
  };
}
