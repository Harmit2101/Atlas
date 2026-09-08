import React, { Suspense, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { DestinationCluster } from '@/types/destination';
import { DESTINATIONS as STATIC_DESTINATIONS } from '@/data/destinations';
import { Globe } from './Globe';
import { CelestialStars } from './CelestialStars';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Compass, Globe2 } from 'lucide-react';

interface GlobeSceneProps {
  className?: string;
  height?: string;
  destinations?: DestinationCluster[];
  selectedDestinationId?: string;
  onDestinationSelect?: (destination: DestinationCluster) => void;
  showHUD?: boolean;
}

export const GlobeScene: React.FC<GlobeSceneProps> = ({
  className = '',
  height = 'h-[500px] md:h-[640px]',
  destinations: propDestinations,
  selectedDestinationId,
  onDestinationSelect,
  showHUD = true
}) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null);

  // Use dynamic destinations if supplied, otherwise fallback to standard hubs
  const destinations = useMemo(() => {
    if (propDestinations && propDestinations.length > 0) {
      return propDestinations;
    }
    return STATIC_DESTINATIONS;
  }, [propDestinations]);

  const initialSelected = destinations.find(d => 
    d.id === selectedDestinationId || d.name.toLowerCase() === selectedDestinationId?.toLowerCase()
  ) || null;

  const [selectedCity, setSelectedCity] = useState<DestinationCluster | null>(initialSelected);

  // Synchronize when selectedDestinationId prop updates from URL
  React.useEffect(() => {
    if (selectedDestinationId) {
      const match = destinations.find(d => 
        d.id === selectedDestinationId || d.name.toLowerCase() === selectedDestinationId.toLowerCase()
      );
      if (match) setSelectedCity(match);
    }
  }, [selectedDestinationId, destinations]);

  const handleCitySelect = (dest: DestinationCluster) => {
    setSelectedCity(dest);
    if (onDestinationSelect) {
      onDestinationSelect(dest);
    } else {
      setTimeout(() => {
        navigate(`/explore?location=${encodeURIComponent(dest.name)}`);
      }, 700);
    }
  };

  const activeCity = destinations.find(d => d.id === (hoveredCityId || selectedCity?.id)) || null;

  const totalListed = useMemo(() => {
    return destinations.reduce((sum, d) => sum + (d.propertyCount || 0), 0);
  }, [destinations]);

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full">
            {destinations.slice(0, 8).map((dest) => (
              <button
                key={dest.id}
                onClick={() => handleCitySelect(dest)}
                className="p-3 text-left border border-white/10 hover:border-[#c5a880] bg-[#111116] transition-colors rounded"
              >
                <div className="text-[10px] uppercase text-[#c5a880] font-mono-luxury">{dest.country}</div>
                <div className="text-sm font-medium text-[#f4f2ec]">{dest.name}</div>
                <div className="text-[11px] text-[#8e8d93] mt-1">{dest.propertyCount} assets</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Transparent Seamless WebGL Canvas - Floats directly on page without rectangular container */
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
              destinations={destinations}
              globeRadius={1.55}
              hoveredCityId={hoveredCityId}
              selectedCity={selectedCity}
              onHoverCity={setHoveredCityId}
              onSelectCity={handleCitySelect}
              autoRotate={!selectedCity}
            />
          </Suspense>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.45}
            dampingFactor={0.08}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={(2.2 * Math.PI) / 3.2}
          />
        </Canvas>
      )}

      {/* Minimalist Telemetry HUD */}
      {showHUD && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none hidden sm:flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono-luxury tracking-widest uppercase text-[#c5a880]">
            <Compass className="w-3 h-3 text-[#c5a880]" />
            <span>GLOBAL ASSET CARTOGRAPHY</span>
          </div>
          {activeCity ? (
            <div className="flex flex-col border-l border-[#c5a880]/40 pl-2.5 mt-0.5 backdrop-blur-sm">
              <span className="text-[10px] uppercase text-[#8e8d93]">{activeCity.country}</span>
              <span className="text-sm font-editorial text-[#f4f2ec] tracking-wide">{activeCity.name}</span>
              <span className="text-[10px] font-mono-luxury text-[#c5a880]">
                {activeCity.propertyCount > 0 ? `${activeCity.propertyCount} LIVE ASSETS` : 'ACTIVE MARKET'}
              </span>
            </div>
          ) : (
            <div className="text-[10px] font-mono-luxury text-[#8e8d93]/80 border-l border-white/10 pl-2">
              {destinations.length} JURISDICTIONS · {totalListed} LIVE ASSETS
            </div>
          )}
        </div>
      )}

      {/* Minimalist Floating Helper Indicator */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none text-right hidden sm:block">
        <span className="text-[9px] uppercase font-mono-luxury tracking-widest text-[#8e8d93] bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/5">
          Drag to Orbit · Select to Filter
        </span>
      </div>
    </div>
  );
};
