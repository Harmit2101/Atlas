import React, { Suspense, useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AtlasProperty } from '@/types/property';
import { calculateSpatialEnvelope } from './spatialMath';
import { SpatialMassingModel } from './SpatialMassingModel';
import { Box, Layers, RotateCcw, Info, Sparkles, Building } from 'lucide-react';
import { 
  registerCanvasMount, 
  registerCanvasUnmount, 
  recordContextLoss, 
  recordContextRestored 
} from '@/services/webglDiagnostics';

interface SpatialMassingSceneProps {
  property: AtlasProperty;
  className?: string;
  height?: string;
  onContextLost?: () => void;
}

export const SpatialMassingScene: React.FC<SpatialMassingSceneProps> = ({
  property,
  className = '',
  height = 'h-[360px] sm:h-[480px] lg:h-[520px]',
  onContextLost
}) => {
  const controlsRef = useRef<any>(null);
  const [isContextLost, setIsContextLost] = useState(false);
  const canvasIdRef = useRef(`spatial-massing-${Math.random().toString(36).slice(2, 8)}`);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<any>(null);

  const handleContextLost = useCallback((e: Event) => {
    e.preventDefault();
    recordContextLoss(canvasIdRef.current, 'spatial-massing');
    setIsContextLost(true);
    onContextLost?.();
  }, [onContextLost]);

  const handleContextRestored = useCallback(() => {
    recordContextRestored(canvasIdRef.current, 'spatial-massing');
    setIsContextLost(false);
  }, []);

  // WebGL Canvas lifecycle registration & event listener cleanup
  useEffect(() => {
    const canvasId = canvasIdRef.current;
    registerCanvasMount(canvasId, 'spatial-massing');

    return () => {
      registerCanvasUnmount(canvasId);

      const el = canvasElRef.current;
      if (el) {
        el.removeEventListener('webglcontextlost', handleContextLost);
        el.removeEventListener('webglcontextrestored', handleContextRestored);
      }

      // Explicitly release hardware WebGL context on unmount
      const gl = glRef.current;
      if (gl) {
        try {
          const loseContext = gl.getExtension('WEBGL_lose_context');
          if (loseContext) {
            loseContext.loseContext();
          }
          gl.dispose();
        } catch {}
      }
    };
  }, [handleContextLost, handleContextRestored]);

  const metrics = useMemo(() => {
    return calculateSpatialEnvelope(property);
  }, [property]);

  const cameraConfig = useMemo(() => {
    const r = metrics.boundingRadius || 4.2;
    const distance = Math.max(r * 1.5, 5.0);
    const yTarget = metrics.dimensions.height * 0.15;
    return {
      position: [distance * 0.75, Math.max(metrics.dimensions.height * 0.9, distance * 0.52), distance * 0.85] as [number, number, number],
      target: [0, yTarget, 0] as [number, number, number],
      minDist: Math.max(r * 0.8, 2.5),
      maxDist: Math.max(r * 3.2, 14.0)
    };
  }, [metrics.boundingRadius, metrics.dimensions.height]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Phase 10: If property genuinely has insufficient spatial data, suppress 3D massing to prevent false precision
  if (!metrics.capability.canRender3DMassing) {
    return (
      <div className={`relative w-full ${height} bg-[#08080a] border border-white/[0.08] rounded-sm overflow-hidden flex flex-col items-center justify-center p-8 text-center select-none ${className}`}>
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:28px_28px]" />
        
        <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#8e8d93] mb-3 shadow-inner">
          <Layers className="w-5 h-5 text-[#c5a880]" />
        </div>

        <div className="text-xs font-mono-luxury uppercase tracking-[0.25em] text-[#f4f2ec]/90 font-medium">
          3D Massing Suppressed
        </div>

        <div className="text-[11px] font-mono-luxury text-[#c5a880] mt-1">
          {metrics.capability.badgeLabel}
        </div>

        <p className="max-w-md text-xs text-[#8e8d93] mt-2.5 font-light leading-relaxed">
          {metrics.capability.disclaimer}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${height} bg-[#08080a] border border-white/[0.08] rounded-sm overflow-hidden select-none ${className}`}>
      {/* Context Lost Non-Destructive Overlay (Phase 13) */}
      {isContextLost && (
        <div className="absolute inset-0 z-30 bg-[#08080a]/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center select-none">
          <div className="text-xs font-mono-luxury uppercase tracking-[0.3em] text-[#c5a880] mb-2 font-medium">
            SPATIAL EXPERIENCE TEMPORARILY UNAVAILABLE
          </div>
          <p className="text-xs text-[#8e8d93] max-w-md mb-4 font-light">
            The browser GPU freed rendering resources during navigation. The 3D model will automatically restore when the context is recovered.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsContextLost(false);
              controlsRef.current?.reset();
            }}
            className="px-5 py-2 rounded bg-[#111116] hover:bg-[#15151c] text-[#f4f2ec] border border-[#c5a880]/50 hover:border-[#c5a880] font-mono-luxury text-xs uppercase tracking-widest transition-all"
          >
            Recheck Experience
          </button>
        </div>
      )}

      {/* HUD Top Bar: Verified Spatial Scale & Metadata Indicators */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Spatial Capability Badge */}
          <div 
            className="px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border flex items-center gap-1.5 text-xs shadow-lg"
            style={{ 
              borderColor: `${metrics.capability.badgeColor}40`,
              color: metrics.capability.badgeColor
            }}
          >
            <Box className="w-3.5 h-3.5" />
            <span className="font-mono-luxury uppercase tracking-wider text-[10.5px] font-medium">
              {metrics.capability.badgeLabel}
            </span>
          </div>

          <div className={`px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border text-xs flex items-center gap-1.5 ${
            metrics.hasVerifiedSqm ? 'border-white/10 text-[#c5a880]' : 'border-white/[0.06] text-[#8e8d93]'
          }`}>
            <Layers className="w-3.5 h-3.5" />
            <span className="font-mono-luxury text-[11px]">
              {metrics.sqmLabel}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border border-white/10 text-[11px] font-mono-luxury text-[#f4f2ec]/90 flex items-center gap-1">
            <Building className="w-3 h-3 text-[#c5a880]" />
            <span>{metrics.floorStackingLabel}</span>
          </div>

          {property.bedrooms > 0 && (
            <div className="px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border border-white/10 text-[11px] font-mono-luxury text-[#f4f2ec]/90">
              {metrics.bedroomsLabel}
            </div>
          )}

          {property.bathrooms > 0 && (
            <div className="px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border border-white/10 text-[11px] font-mono-luxury text-[#f4f2ec]/90">
              {metrics.bathroomsLabel}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleResetCamera}
          className="pointer-events-auto p-1.5 rounded bg-[#111116]/90 hover:bg-white/10 border border-white/10 text-[#8e8d93] hover:text-[#f4f2ec] transition-colors self-start"
          title="Reset Camera View"
          aria-label="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Three.js R3F Canvas */}
      <Canvas
        camera={{ position: cameraConfig.position, fov: 38 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        onCreated={({ gl }) => {
          glRef.current = gl;
          gl.setClearColor(0x08080a, 1);
          const canvasEl = gl.domElement;
          canvasElRef.current = canvasEl;
          canvasEl.addEventListener('webglcontextlost', handleContextLost, false);
          canvasEl.addEventListener('webglcontextrestored', handleContextRestored, false);
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <fogExp2 attach="fog" args={['#08080a', 0.026]} />
        <ambientLight intensity={0.7} color="#e8e6e3" />
        <directionalLight position={[12, 16, 10]} intensity={1.9} color="#ffffff" />
        <pointLight position={[-10, 8, -10]} intensity={1.1} color="#c5a880" />
        <pointLight position={[8, -3, 8]} intensity={0.5} color="#527494" />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          target={cameraConfig.target}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={cameraConfig.minDist}
          maxDistance={cameraConfig.maxDist}
          rotateSpeed={0.65}
        />

        <Suspense fallback={null}>
          <SpatialMassingModel metrics={metrics} />
        </Suspense>
      </Canvas>

      {/* Bottom HUD: Honest Spatial Preview Disclaimer */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 text-[10px] text-[#8e8d93] font-light">
          <Info className="w-3 h-3 text-[#c5a880] shrink-0" />
          <span>
            {metrics.disclaimer}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[9px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]/80 self-end sm:self-auto">
          <Sparkles className="w-3 h-3 text-[#c5a880]/60" />
          <span>Left Drag Orbit · Scroll Zoom</span>
        </div>
      </div>
    </div>
  );
};
