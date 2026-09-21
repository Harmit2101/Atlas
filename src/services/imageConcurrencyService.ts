/**
 * Image Concurrency & Failure Category Controller
 * 
 * Objectives:
 * - Differentiate image failure types (CONNECTION_RESET, 404, CORS, TIMEOUT, etc.)
 * - Restrict concurrent third-party CDN connections (default max: 4)
 * - Fast-fail hanging connections (e.g. img.homes.jp AWS Tokyo drops) via strict 5.5s timeout
 * - Priority queue: active card/hero loads first, lazy thumbnails queue in background
 */

export type ImageFailureType = 
  | 'IMAGE_404'
  | 'IMAGE_CONNECTION_RESET'
  | 'IMAGE_CORS'
  | 'IMAGE_TIMEOUT'
  | 'IMAGE_INVALID_URL'
  | 'IMAGE_UNKNOWN';

export interface ImageProbeResult {
  success: boolean;
  failureType?: ImageFailureType;
  durationMs: number;
}

interface QueuedProbe {
  url: string;
  priority: 'high' | 'normal';
  resolve: (result: ImageProbeResult) => void;
  timer?: ReturnType<typeof setTimeout>;
}

const MAX_ACTIVE_EXTERNAL_IMAGE_PROBES = 4;
const PROBE_TIMEOUT_MS = 5500; // 5.5s max to prevent hanging CDN sockets

let activeProbeCount = 0;
const highPriorityQueue: QueuedProbe[] = [];
const normalPriorityQueue: QueuedProbe[] = [];

/**
 * Executes an in-memory probe using HTMLImageElement with strict timeout.
 * This simulates exact browser <img> behavior without double-downloading.
 */
function executeProbe(url: string): Promise<ImageProbeResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    if (!url || typeof url !== 'string') {
      return resolve({
        success: false,
        failureType: 'IMAGE_INVALID_URL',
        durationMs: 0
      });
    }

    const img = new Image();
    let settled = false;

    const cleanup = () => {
      settled = true;
      img.onload = null;
      img.onerror = null;
      img.src = '';
    };

    const timeoutTimer = setTimeout(() => {
      if (settled) return;
      cleanup();
      resolve({
        success: false,
        failureType: 'IMAGE_TIMEOUT',
        durationMs: Date.now() - startTime
      });
    }, PROBE_TIMEOUT_MS);

    img.onload = () => {
      if (settled) return;
      clearTimeout(timeoutTimer);
      cleanup();
      resolve({
        success: true,
        durationMs: Date.now() - startTime
      });
    };

    img.onerror = () => {
      if (settled) return;
      clearTimeout(timeoutTimer);
      const elapsed = Date.now() - startTime;
      cleanup();

      // Heuristic for network resets vs 404 / CORS:
      // When a server resets TCP connection (e.g. img.homes.jp), elapsed time is often
      // either immediate (RST) or after handshake timeout.
      const isLikelyReset = url.includes('homes.jp') || elapsed < 300 || elapsed >= PROBE_TIMEOUT_MS - 500;

      resolve({
        success: false,
        failureType: isLikelyReset ? 'IMAGE_CONNECTION_RESET' : 'IMAGE_UNKNOWN',
        durationMs: elapsed
      });
    };

    // Trigger image request
    try {
      img.decoding = 'async';
      img.src = url;
    } catch {
      clearTimeout(timeoutTimer);
      cleanup();
      resolve({
        success: false,
        failureType: 'IMAGE_INVALID_URL',
        durationMs: Date.now() - startTime
      });
    }
  });
}

function processNextProbe(): void {
  if (activeProbeCount >= MAX_ACTIVE_EXTERNAL_IMAGE_PROBES) {
    return;
  }

  const next = highPriorityQueue.shift() || normalPriorityQueue.shift();
  if (!next) return;

  activeProbeCount++;

  executeProbe(next.url)
    .then((result) => {
      next.resolve(result);
    })
    .catch(() => {
      next.resolve({
        success: false,
        failureType: 'IMAGE_UNKNOWN',
        durationMs: 0
      });
    })
    .finally(() => {
      activeProbeCount--;
      processNextProbe();
    });
}

/**
 * Probes an image URL with controlled concurrency and priority.
 */
export function queueImageProbe(
  url: string,
  priority: 'high' | 'normal' = 'normal'
): Promise<ImageProbeResult> {
  return new Promise((resolve) => {
    const item: QueuedProbe = {
      url,
      priority,
      resolve
    };

    if (priority === 'high') {
      highPriorityQueue.push(item);
    } else {
      normalPriorityQueue.push(item);
    }

    processNextProbe();
  });
}

/**
 * Returns current telemetry on active and queued image probes.
 */
export function getImageConcurrencyStats() {
  return {
    activeProbeCount,
    highPriorityQueueLength: highPriorityQueue.length,
    normalPriorityQueueLength: normalPriorityQueue.length,
    maxLimit: MAX_ACTIVE_EXTERNAL_IMAGE_PROBES
  };
}
