import React, { Suspense, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { DestinationCluster } from '@/types/destination';
import { DESTINATIONS as STATIC_DESTINATIONS } from '@/data/destinations';
import { Globe } from './Globe';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Compass, Globe2 } from 'lucide-react';
import { GlobeLoader } from '@/components/ui/LoadingSkeleton';

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
  height = 'h-[540px] md:h-[680px]',
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

  const initialSelected = destinations.find(d => d.id === selectedDestinationId) || null;
  const [selectedCity, setSelectedCity] = useState<DestinationCluster | null>(initialSelected);

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
    <div className={`relative w-full ${height} select-none ${className}`}>
      {/* Accessible 2D Fallback for Reduced Motion */}
      {prefersReducedMotion ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
          <Globe2 className="w-12 h-12 text-[#c5a880] mb-4" />
          <h3 className="text-xl font-editorial text-[#f4f2ec] mb-2">Global Discovery Directory</h3>
          <p className="text-xs text-[#8e8d93] max-w-md mb-6">
            Explore premier financial capitals and coastal enclaves across the globe.
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
        /* Transparent Seamless Canvas without enclosing box or container border */
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{ 
            antialias: true, 
            alpha: true, 
            powerPreference: 'high-performance' 
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing bg-transparent"
        >
          {/* Restrained cinematic lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 8, 5]} intensity={1.8} color="#fbf7ee" />
          <pointLight position={[-10, -5, -10]} intensity={0.6} color="#c5a880" />

          {/* Subtle celestial dust */}
          <Stars radius={40} depth={20} count={900} factor={2.5} saturation={0} fade speed={0.4} />

          <Suspense fallback={null}>
            <Globe
              destinations={destinations}
              globeRadius={1.9}
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
            rotateSpeed={0.5}
            dampingFactor={0.08}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={(2 * Math.PI) / 3}
          />
        </Canvas>
      )}

      {/* Luxury Telemetry HUD Overlay */}
      {showHUD && (
        <div className="absolute top-6 left-6 z-20 pointer-events-none hidden sm:flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[10px] font-mono-luxury tracking-widest uppercase text-[#c5a880]">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '14s' }} />
            <span>GLOBAL ASSET INTELLIGENCE · LAT/LON GRID</span>
          </div>
          {activeCity ? (
            <div className="flex flex-col border-l border-[#c5a880]/40 pl-3 mt-1 backdrop-blur-sm">
              <span className="text-xs uppercase text-[#8e8d93]">{activeCity.country}</span>
              <span className="text-base font-editorial text-[#f4f2ec] tracking-wide">{activeCity.name}</span>
              <span className="text-[11px] font-mono-luxury text-[#c5a880]">
                {activeCity.coordinatesFormatted} · {activeCity.propertyCount} OPPORTUNITIES
              </span>
            </div>
          ) : (
            <div className="text-[11px] font-mono-luxury text-[#8e8d93] border-l border-white/10 pl-3">
              ORBIT TO EXPLORE · {destinations.length} HUBS · {totalListed} ASSETS TOTAL
            </div>
          )}
        </div>
      )}

      {/* Bottom helper badge */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none text-right hidden sm:block">
        <span className="text-[10px] uppercase font-mono-luxury tracking-widest text-[#8e8d93] bg-[#0c0c10]/60 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded">
          Drag to Rotate Globe · Select Hub to Explore
        </span>
      </div>
    </div>
  );
};
