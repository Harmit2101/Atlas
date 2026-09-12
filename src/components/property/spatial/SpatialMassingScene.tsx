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
  height = 'h-[440px] sm:h-[520px]'
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

  const handleResetCamera = () => {
    setControlsKey(prev => prev + 1);
  };

  return (
    <div className={`relative w-full ${height} bg-[#08080a] border border-white/[0.08] rounded-sm overflow-hidden select-none ${className}`}>
      {/* HUD Top Bar: Verified Spatial Scale */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-xs text-[#f4f2ec]">
            <Box className="w-3.5 h-3.5 text-[#c5a880]" />
            <span className="font-mono-luxury uppercase tracking-wider text-[11px]">
              {metrics.typology.toUpperCase()} ENVELOPE
            </span>
          </div>

          <div className="px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-xs text-[#c5a880]">
            <Layers className="w-3.5 h-3.5" />
            <span className="font-mono-luxury text-[11px]">
              {metrics.sqmLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetCamera}
          className="pointer-events-auto p-1.5 rounded bg-[#111116]/90 hover:bg-white/10 border border-white/10 text-[#8e8d93] hover:text-[#f4f2ec] transition-colors"
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
        camera={{ position: [5.2, 4.2, 6.2], fov: 40 }}
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
        <ambientLight intensity={0.65} />
        <directionalLight position={[10, 14, 8]} intensity={1.8} color="#ffffff" />
        <pointLight position={[-8, 6, -8]} intensity={0.6} color="#c5a880" />
        <pointLight position={[6, -4, 6]} intensity={0.4} color="#6580a5" />

        <OrbitControls
          key={controlsKey}
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={3.5}
          maxDistance={16}
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
            Conceptual architectural envelope derived from verified MLS metadata. Not a literal structural blueprint.
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
