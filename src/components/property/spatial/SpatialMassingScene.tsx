import React, { Suspense, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AtlasProperty } from '@/types/property';
import { calculateSpatialEnvelope } from './spatialMath';
import { SpatialMassingModel } from './SpatialMassingModel';
import { Box, Layers, RotateCcw, Info, Sparkles } from 'lucide-react';

interface SpatialMassingSceneProps {
  property: AtlasProperty;
  className?: string;
  height?: string;
}

export const SpatialMassingScene: React.FC<SpatialMassingSceneProps> = ({
  property,
  className = '',
  height = 'h-[360px] sm:h-[480px] lg:h-[520px]'
}) => {
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [controlsKey, setControlsKey] = useState(0);

  const metrics = useMemo(() => {
    return calculateSpatialEnvelope(property);
  }, [property]);

  const activeZone = useMemo(() => {
    if (!activeZoneId) return null;
    return metrics.zones.find(z => z.id === activeZoneId) || null;
  }, [activeZoneId, metrics.zones]);

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
    setControlsKey(prev => prev + 1);
  };

  return (
    <div className={`relative w-full ${height} bg-[#08080a] border border-white/[0.08] rounded-sm overflow-hidden select-none ${className}`}>
      {/* HUD Top Bar: Verified Spatial Scale & Missing Metadata Indicators */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-xs text-[#f4f2ec]">
            <Box className="w-3.5 h-3.5 text-[#c5a880]" />
            <span className="font-mono-luxury uppercase tracking-wider text-[11px]">
              {metrics.typology.toUpperCase()} MASSING
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

          <div className="px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border border-white/10 text-[11px] font-mono-luxury text-[#f4f2ec]/90">
            {metrics.bedroomsLabel}
          </div>

          <div className="px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border border-white/10 text-[11px] font-mono-luxury text-[#f4f2ec]/90">
            {metrics.bathroomsLabel}
          </div>
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

      {/* Active Zone Callout */}
      {activeZone && (
        <div className="absolute top-16 left-4 z-10 pointer-events-none animate-fadeIn">
          <div className="px-3 py-1.5 rounded bg-[#c5a880]/15 backdrop-blur-md border border-[#c5a880]/40 text-xs">
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880] block">
              Conceptual Zone
            </span>
            <span className="font-editorial text-sm text-[#f4f2ec]">
              {activeZone.label}
            </span>
          </div>
        </div>
      )}

      {/* Three.js R3F Canvas */}
      <Canvas
        key={controlsKey}
        camera={{ position: cameraConfig.position, fov: 38 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x08080a, 1);
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <fogExp2 attach="fog" args={['#08080a', 0.026]} />
        <ambientLight intensity={0.7} color="#e8e6e3" />
        <directionalLight position={[12, 16, 10]} intensity={1.9} color="#ffffff" />
        <pointLight position={[-10, 8, -10]} intensity={1.1} color="#c5a880" />
        <pointLight position={[8, -3, 8]} intensity={0.5} color="#527494" />

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          target={cameraConfig.target}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={cameraConfig.minDist}
          maxDistance={cameraConfig.maxDist}
          rotateSpeed={0.65}
        />

        <Suspense fallback={null}>
          <SpatialMassingModel
            metrics={metrics}
            activeZoneId={activeZoneId}
            onZoneHover={setActiveZoneId}
          />
        </Suspense>
      </Canvas>

      {/* Bottom HUD: Disclaimer & Navigation Hints */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 text-[10px] text-[#8e8d93] font-light">
          <Info className="w-3 h-3 text-[#c5a880] shrink-0" />
          <span>
            Conceptual volumetric envelope derived from verified Untera listing metadata. Does not represent interior CAD drawings.
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
