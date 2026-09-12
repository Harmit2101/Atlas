import React, { Suspense, useState, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { AtlasProperty } from '@/types/property';
import { Globe } from './Globe';
import { CelestialStars } from './CelestialStars';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { isValidCoordinate } from '@/services/destinationService';
import { Compass, Globe2 } from 'lucide-react';

interface GlobeSceneProps {
  className?: string;
  height?: string;
  properties?: AtlasProperty[];
  selectedPropertyId?: string | null;
  onPropertySelect?: (property: AtlasProperty) => void;
  showHUD?: boolean;
  totalListingsCount?: number;
  // Retained for backward-compatibility with other callers:
  destinations?: any[];
  selectedDestinationId?: string;
  onDestinationSelect?: (destination: any) => void;
}

export const GlobeScene: React.FC<GlobeSceneProps> = ({
  className = '',
  height = 'h-[500px] md:h-[640px]',
  properties = [],
  selectedPropertyId = null,
  onPropertySelect,
  showHUD = true,
  totalListingsCount
}) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Click on property marker navigates directly to the live property detail page
  const handlePropertySelect = useCallback((property: AtlasProperty) => {
    if (onPropertySelect) {
      onPropertySelect(property);
    }
    navigate(`/property/${property.id}`);
  }, [onPropertySelect, navigate]);

  const geocodedProperties = useMemo(() => {
    return properties.filter(p => isValidCoordinate(p.latitude, p.longitude));
  }, [properties]);

  const uniqueLocationsCount = useMemo(() => {
    const set = new Set<string>();
    for (const p of geocodedProperties) {
      set.add(`${p.latitude.toFixed(4)}_${p.longitude.toFixed(4)}`);
    }
    return set.size;
  }, [geocodedProperties]);

  const totalGeolocated = geocodedProperties.length;
  const displayTotal = totalListingsCount !== undefined ? totalListingsCount : totalGeolocated;

  return (
    <div className={`relative w-full ${height} select-none bg-transparent overflow-visible ${className}`}>
      {/* Accessible 2D Fallback for Reduced Motion */}
      {prefersReducedMotion ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
          <Globe2 className="w-10 h-10 text-[#c5a880] mb-3" />
          <h3 className="text-lg font-editorial text-[#f4f2ec] mb-1">Global Property Discovery</h3>
          <p className="text-xs text-[#8e8d93] max-w-md mb-6">
            Live geographic inventory streaming from verified international MLS syndicates.
          </p>
          {geocodedProperties.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full max-h-[360px] overflow-y-auto">
              {geocodedProperties.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => handlePropertySelect(prop)}
                  className="p-3 text-left border border-white/10 hover:border-[#c5a880] bg-[#111116] transition-colors rounded"
                >
                  <div className="text-[10px] uppercase text-[#c5a880] font-mono-luxury truncate">
                    {prop.city}, {prop.country}
                  </div>
                  <div className="text-xs font-medium text-[#f4f2ec] truncate">{prop.title}</div>
                  <div className="text-[11px] text-[#8e8d93] mt-1">{prop.priceFormatted}</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8e8d93]">
              No geocoded properties in current inventory selection.
            </p>
          )}
        </div>
      ) : (
        /* Transparent Seamless WebGL Canvas */
        <Canvas
          camera={{ position: [0, 0, 5.8], fov: 36 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing bg-transparent"
        >
          {/* Subtle cinematic lighting */}
          <ambientLight intensity={0.45} />
          <directionalLight position={[10, 8, 6]} intensity={1.6} color="#ffffff" />
          <pointLight position={[-10, -5, -8]} intensity={0.4} color="#6580a5" />

          {/* Restrained celestial starfield */}
          <CelestialStars radius={45} depth={25} count={500} speed={0.2} />

          <Suspense fallback={null}>
            <Globe
              properties={properties}
              globeRadius={1.55}
              hoveredId={hoveredId}
              selectedPropertyId={selectedPropertyId}
              onHoverId={setHoveredId}
              onSelectProperty={handlePropertySelect}
              autoRotate={!selectedPropertyId}
            />
          </Suspense>

          <OrbitControls
            enableZoom={true}
            minDistance={2.4}
            maxDistance={7.0}
            rotateSpeed={0.45}
            dampingFactor={0.08}
            minPolarAngle={Math.PI / 3.4}
            maxPolarAngle={(2.3 * Math.PI) / 3.4}
          />
        </Canvas>
      )}

      {/* Minimalist Telemetry HUD (Zero Cluster Jargon) */}
      {showHUD && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none hidden sm:flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono-luxury tracking-widest uppercase text-[#c5a880]">
            <Compass className="w-3 h-3 text-[#c5a880]" />
            <span>GLOBAL ASSET CARTOGRAPHY · REAL EARTH</span>
          </div>

          {totalGeolocated > 0 ? (
            <div className="text-[10px] font-mono-luxury text-[#8e8d93]/90 border-l border-white/10 pl-2 space-y-0.5">
              <div className="text-[#f4f2ec]">
                {displayTotal} LIVE {displayTotal === 1 ? 'LISTING' : 'LISTINGS'} · {totalGeolocated} GEOLOCATED
              </div>
              <div className="text-[9px] text-[#c5a880]">
                {uniqueLocationsCount} DISTINCT {uniqueLocationsCount === 1 ? 'LOCATION' : 'LOCATIONS'}
              </div>
            </div>
          ) : (
            <div className="text-[10px] font-mono-luxury text-[#8e8d93]/80 border-l border-white/10 pl-2">
              0 GEOLOCATED PROPERTIES AVAILABLE
            </div>
          )}
        </div>
      )}

      {/* Minimalist Floating Navigation Helper */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none text-right hidden sm:block">
        <span className="text-[9px] uppercase font-mono-luxury tracking-widest text-[#8e8d93] bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
          Drag to Rotate · Scroll to Zoom · Click Marker to View Dossier
        </span>
      </div>
    </div>
  );
};
