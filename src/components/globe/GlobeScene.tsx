import React, { Suspense, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { AtlasProperty } from '@/types/property';
import { CountryBeacon } from '@/services/countryBeacons';
import { Globe } from './Globe';
import { CelestialStars } from './CelestialStars';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { isValidCoordinate } from '@/services/destinationService';
import { Compass, Globe2, RotateCcw } from 'lucide-react';
import { 
  registerCanvasMount, 
  registerCanvasUnmount, 
  recordContextLoss, 
  recordContextRestored 
} from '@/services/webglDiagnostics';
import { latLonToVector3 } from './globeUtils';

interface GlobeCameraControllerProps {
  isZoomed?: boolean;
  selectedCountryCode?: string | null;
  selectedPropertyId?: string | null;
  countryBeacons?: CountryBeacon[];
  properties?: AtlasProperty[];
  globeRadius?: number;
  globeGroupRef: React.RefObject<THREE.Group | null>;
  controlsRef: React.RefObject<any>;
}

// Smooth Three.js camera fly-to controller focusing directly on selected countries/properties
function GlobeCameraController({
  isZoomed = false,
  selectedCountryCode = null,
  selectedPropertyId = null,
  countryBeacons = [],
  properties = [],
  globeRadius = 1.55,
  globeGroupRef,
  controlsRef
}: GlobeCameraControllerProps) {
  const { camera } = useThree();
  const animatingRef = useRef(false);
  const targetPosRef = useRef<THREE.Vector3 | null>(null);
  const prevTargetKeyRef = useRef<string | null>(null);

  // Derive unique key for current focus target
  const targetKey = useMemo(() => {
    if (selectedCountryCode) return `country:${selectedCountryCode.toUpperCase()}`;
    if (selectedPropertyId) return `prop:${selectedPropertyId}`;
    if (isZoomed) return 'zoomed:generic';
    return 'orbit:global';
  }, [selectedCountryCode, selectedPropertyId, isZoomed]);

  // When target changes, calculate target position in 3D world space
  useEffect(() => {
    if (targetKey === prevTargetKeyRef.current) return;
    prevTargetKeyRef.current = targetKey;

    let targetLat: number | null = null;
    let targetLng: number | null = null;
    let targetDist = 5.8;

    if (selectedCountryCode) {
      const beacon = countryBeacons.find(
        (b) => b.country.toUpperCase() === selectedCountryCode.toUpperCase()
      );
      if (beacon) {
        targetLat = beacon.latitude;
        targetLng = beacon.longitude;
        targetDist = 3.25;
      }
    } else if (selectedPropertyId) {
      const prop = properties.find((p) => p.id === selectedPropertyId);
      if (prop && isValidCoordinate(prop.latitude, prop.longitude)) {
        targetLat = prop.latitude;
        targetLng = prop.longitude;
        targetDist = 2.65;
      }
    } else if (isZoomed) {
      targetDist = 3.4;
    }

    if (targetLat !== null && targetLng !== null) {
      // Calculate Cartesian coordinates in globe local space
      const localPos = latLonToVector3(targetLat, targetLng, globeRadius);

      // Transform to world space using globe group's current orientation
      const worldPos = localPos.clone();
      if (globeGroupRef.current) {
        globeGroupRef.current.updateMatrixWorld();
        worldPos.applyMatrix4(globeGroupRef.current.matrixWorld);
      }

      const dir = worldPos.clone().normalize();
      targetPosRef.current = dir.multiplyScalar(targetDist);
      animatingRef.current = true;
    } else {
      // Return to global orbit: retain current direction angle, just dolly out to orbit distance
      const dir = camera.position.clone().normalize();
      targetPosRef.current = dir.multiplyScalar(targetDist);
      animatingRef.current = true;
    }
  }, [
    targetKey,
    selectedCountryCode,
    selectedPropertyId,
    isZoomed,
    countryBeacons,
    properties,
    globeRadius,
    globeGroupRef,
    camera
  ]);

  // Cancel programmatic camera animation immediately if user starts manual orbit drag
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      animatingRef.current = false;
    };

    controls.addEventListener('start', handleStart);
    return () => {
      controls.removeEventListener('start', handleStart);
    };
  }, [controlsRef]);

  // Frame loop: smooth great-circle slerp and distance damping
  useFrame((_, delta) => {
    if (!animatingRef.current || !targetPosRef.current) return;

    const currentPos = camera.position;
    const targetPos = targetPosRef.current;

    const currentDist = currentPos.length();
    const targetDist = targetPos.length();

    const currentDir = currentPos.clone().normalize();
    const targetDir = targetPos.clone().normalize();

    // Responsive damping parameters
    const rotSpeed = 1 - Math.exp(-4.5 * delta);
    const distSpeed = 3.8;

    // Handle near-antipodal directions safely
    let nextDir: THREE.Vector3;
    const dot = currentDir.dot(targetDir);
    if (dot < -0.99) {
      const perp = new THREE.Vector3(-currentDir.z, 0, currentDir.x).normalize();
      if (perp.lengthSq() < 0.01) perp.set(1, 0, 0);
      const mid = currentDir.clone().add(perp).normalize();
      nextDir = currentDir.clone().lerp(mid, rotSpeed).normalize();
    } else {
      nextDir = currentDir.clone().lerp(targetDir, rotSpeed).normalize();
    }

    const nextDist = THREE.MathUtils.damp(currentDist, targetDist, distSpeed, delta);
    const nextPos = nextDir.multiplyScalar(nextDist);

    camera.position.copy(nextPos);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();

    // Check convergence threshold
    const distToTarget = camera.position.distanceTo(targetPos);
    if (distToTarget < 0.015) {
      camera.position.copy(targetPos);
      camera.lookAt(0, 0, 0);
      controlsRef.current?.target.set(0, 0, 0);
      controlsRef.current?.update();
      animatingRef.current = false;
    }
  });

  return null;
}

interface GlobeSceneProps {
  className?: string;
  height?: string;
  properties?: AtlasProperty[];
  countryBeacons?: CountryBeacon[];
  selectedPropertyId?: string | null;
  selectedCountryCode?: string | null;
  onPropertySelect?: (property: AtlasProperty) => void;
  onCountrySelect?: (beacon: CountryBeacon) => void;
  isZoomed?: boolean;
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
  countryBeacons = [],
  selectedPropertyId = null,
  selectedCountryCode = null,
  onPropertySelect,
  onCountrySelect,
  isZoomed = false,
  showHUD = true,
  totalListingsCount
}) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isContextLost, setIsContextLost] = useState(false);
  const canvasIdRef = useRef(`globe-${Math.random().toString(36).slice(2, 8)}`);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const globeGroupRef = useRef<THREE.Group>(null);

  const handleContextLost = useCallback((e: Event) => {
    e.preventDefault();
    recordContextLoss(canvasIdRef.current, 'globe');
    setIsContextLost(true);
  }, []);

  const handleContextRestored = useCallback(() => {
    recordContextRestored(canvasIdRef.current, 'globe');
    setIsContextLost(false);
  }, []);

  // WebGL Canvas lifecycle registration & event listener cleanup
  useEffect(() => {
    const canvasId = canvasIdRef.current;
    registerCanvasMount(canvasId, 'globe');

    return () => {
      registerCanvasUnmount(canvasId);

      const el = canvasElRef.current;
      if (el) {
        el.removeEventListener('webglcontextlost', handleContextLost);
        el.removeEventListener('webglcontextrestored', handleContextRestored);
      }

      // Explicitly release hardware WebGL context on unmount to free browser GPU context slot
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
      {/* Accessible 2D Fallback for Reduced Motion or Context Recovery */}
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
        <>
          {/* Context Loss Non-Destructive Overlay (Phase 13) */}
          {isContextLost && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-[#08080a]/90 rounded border border-white/10">
              <Globe2 className="w-10 h-10 text-[#c5a880] mb-3" />
              <h3 className="text-sm font-mono-luxury uppercase tracking-widest text-[#f4f2ec] mb-1">
                Globe View Temporarily Suspended
              </h3>
              <p className="text-xs text-[#8e8d93] max-w-md mb-4 font-light">
                GPU rendering resources were freed during route navigation. The globe will restore automatically when context is recovered.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsContextLost(false);
                }}
                className="px-5 py-2 rounded bg-[#111116] hover:bg-[#15151c] text-[#f4f2ec] border border-[#c5a880]/50 hover:border-[#c5a880] font-mono-luxury text-xs uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#c5a880]" />
                <span>Recheck Planetary Globe</span>
              </button>
            </div>
          )}

          {/* Transparent Seamless WebGL Canvas */}
          <Canvas
            camera={{ position: [0, 0, 5.8], fov: 36 }}
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance'
            }}
            raycaster={{
              params: {
                Line: { threshold: 0.01 },
                Points: { threshold: 0.01 },
                Mesh: {},
                LOD: {},
                Sprite: {}
              }
            }}
            onCreated={({ gl }) => {
              glRef.current = gl;
              gl.setClearColor(0x000000, 0);
              const canvasEl = gl.domElement;
              canvasElRef.current = canvasEl;

              canvasEl.addEventListener('webglcontextlost', handleContextLost, false);
              canvasEl.addEventListener('webglcontextrestored', handleContextRestored, false);
            }}
            className="w-full h-full cursor-grab active:cursor-grabbing bg-transparent"
          >
          {/* Subtle cinematic lighting */}
          <ambientLight intensity={0.45} />
          <directionalLight position={[10, 8, 6]} intensity={1.6} color="#ffffff" />
          <pointLight position={[-10, -5, -8]} intensity={0.4} color="#6580a5" />

          {/* Restrained celestial starfield */}
          <CelestialStars radius={45} depth={25} count={500} speed={0.2} />

          {/* Smooth camera fly-to controller focusing directly on countries/properties */}
          <GlobeCameraController
            isZoomed={isZoomed}
            selectedCountryCode={selectedCountryCode}
            selectedPropertyId={selectedPropertyId}
            countryBeacons={countryBeacons}
            properties={properties}
            globeRadius={1.55}
            globeGroupRef={globeGroupRef}
            controlsRef={controlsRef}
          />

          <Suspense fallback={null}>
            <Globe
              groupRef={globeGroupRef}
              properties={properties}
              countryBeacons={countryBeacons}
              globeRadius={1.55}
              hoveredId={hoveredId}
              selectedPropertyId={selectedPropertyId}
              selectedCountryCode={selectedCountryCode}
              onHoverId={setHoveredId}
              onSelectProperty={handlePropertySelect}
              onSelectCountry={onCountrySelect}
              autoRotate={!selectedPropertyId && !selectedCountryCode}
            />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enableZoom={true}
            minDistance={2.4}
            maxDistance={7.0}
            rotateSpeed={0.45}
            dampingFactor={0.08}
            minPolarAngle={0.08}
            maxPolarAngle={Math.PI - 0.08}
          />
        </Canvas>
        </>
      )}

      {/* Minimalist Telemetry HUD */}
      {showHUD && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none hidden sm:flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono-luxury tracking-widest uppercase text-[#c5a880]">
            <Compass className="w-3 h-3 text-[#c5a880]" />
            <span>GLOBAL ASSET CARTOGRAPHY · REAL EARTH</span>
          </div>

          <div className="text-[10px] font-mono-luxury text-[#8e8d93]/90 border-l border-white/10 pl-2 space-y-0.5">
            {countryBeacons.length > 0 ? (
              <>
                <div className="text-[#f4f2ec]">
                  {countryBeacons.length} SOVEREIGN JURISDICTIONS ACTIVE
                </div>
                <div className="text-[9px] text-[#c5a880]">
                  4,012,480+ LIVE MLS ASSETS TRACKED · CLICK BEACON TO TELEPORT
                </div>
              </>
            ) : totalGeolocated > 0 ? (
              <>
                <div className="text-[#f4f2ec]">
                  {displayTotal} LIVE {displayTotal === 1 ? 'LISTING' : 'LISTINGS'} · {totalGeolocated} GEOLOCATED
                </div>
                <div className="text-[9px] text-[#c5a880]">
                  {uniqueLocationsCount} DISTINCT {uniqueLocationsCount === 1 ? 'LOCATION' : 'LOCATIONS'}
                </div>
              </>
            ) : (
              <div className="text-[10px] font-mono-luxury text-[#8e8d93]/80">
                0 GEOLOCATED PROPERTIES AVAILABLE
              </div>
            )}
          </div>
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
