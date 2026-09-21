/**
 * WebGL Canvas Lifecycle Diagnostics & Forensic Registry
 * 
 * Phase 9 & 14 Compliance:
 * - Exposes window.__ATLAS_WEBGL__ with activeCanvasCount, canvasIds, mountedAt, unmountedAt, contextLossCount, contextRestoreCount
 * - Exactly one mount registration and one unmount deregistration per Canvas
 * - Verbose console logs gated strictly behind localStorage.getItem('atlas_debug') === '1'
 */

export interface CanvasRecord {
  id: string;
  type: 'globe' | 'spatial-massing' | 'photo-immersion';
  mountTime: number;
}

const activeCanvases = new Map<string, CanvasRecord>();
const mountedAtMap: Record<string, number> = {};
const unmountedAtMap: Record<string, number> = {};
let contextLostEventsCount = 0;
let contextRestoredEventsCount = 0;

function isAtlasDebugEnabled(): boolean {
  return typeof window !== 'undefined' && window.localStorage?.getItem('atlas_debug') === '1';
}

export function registerCanvasMount(id: string, type: CanvasRecord['type']): void {
  const now = Date.now();
  activeCanvases.set(id, {
    id,
    type,
    mountTime: now
  });
  mountedAtMap[id] = now;

  if (isAtlasDebugEnabled()) {
    if (activeCanvases.size > 1) {
      console.warn(
        `[Atlas WebGL Forensic] Multiple active canvases detected (${activeCanvases.size}):`,
        Array.from(activeCanvases.values()).map(c => `${c.type} (${c.id})`).join(', ')
      );
    } else {
      console.debug(`[Atlas WebGL Forensic] Canvas mounted: ${type} (${id}). Total active: ${activeCanvases.size}`);
    }
  }
}

export function registerCanvasUnmount(id: string): void {
  const record = activeCanvases.get(id);
  const now = Date.now();
  unmountedAtMap[id] = now;

  if (record) {
    const lifespan = now - record.mountTime;
    activeCanvases.delete(id);
    if (isAtlasDebugEnabled()) {
      console.debug(`[Atlas WebGL Forensic] Canvas unmounted: ${record.type} (${id}) after ${lifespan}ms. Total active: ${activeCanvases.size}`);
    }
  }
}

export function recordContextLoss(id: string, type: CanvasRecord['type']): void {
  contextLostEventsCount++;
  if (isAtlasDebugEnabled()) {
    console.warn(`[Atlas WebGL Forensic] Context LOST on ${type} (${id}). Total losses: ${contextLostEventsCount}`);
  }
}

export function recordContextRestored(id: string, type: CanvasRecord['type']): void {
  contextRestoredEventsCount++;
  if (isAtlasDebugEnabled()) {
    console.info(`[Atlas WebGL Forensic] Context RESTORED on ${type} (${id}). Total restorations: ${contextRestoredEventsCount}`);
  }
}

export function getWebGLDiagnostics() {
  return {
    activeCanvasCount: activeCanvases.size,
    canvasIds: Array.from(activeCanvases.keys()),
    mountedAt: { ...mountedAtMap },
    unmountedAt: { ...unmountedAtMap },
    contextLossCount: contextLostEventsCount,
    contextRestoreCount: contextRestoredEventsCount
  };
}

if (typeof window !== 'undefined') {
  (window as any).__ATLAS_WEBGL__ = getWebGLDiagnostics();
  Object.defineProperty(window, '__ATLAS_WEBGL__', {
    get: getWebGLDiagnostics,
    configurable: true
  });
  (window as any).__webglDiagnostics = getWebGLDiagnostics;
}
