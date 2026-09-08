import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Destination } from '@/types/destination';
import { CityMarker, latLonToVector3 } from './CityMarker';
import { Atmosphere } from './Atmosphere';

interface GlobeProps {
  destinations: Destination[];
  globeRadius?: number;
  hoveredCityId: string | null;
  selectedCity: Destination | null;
  onHoverCity: (id: string | null) => void;
  onSelectCity: (destination: Destination) => void;
  autoRotate?: boolean;
}

export const Globe: React.FC<GlobeProps> = ({
  destinations,
  globeRadius = 2.0,
  hoveredCityId,
  selectedCity,
  onHoverCity,
  onSelectCity,
  autoRotate = true
}) => {
  const globeGroupRef = useRef<THREE.Group>(null);
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);

  // Generate an elegant procedural cartographic constellation / point grid across the globe
  const gridDots = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const sampleLatSteps = 36;
    const sampleLonSteps = 72;

    for (let i = 1; i < sampleLatSteps; i++) {
      const lat = 90 - (180 / sampleLatSteps) * i;
      // Skip extreme poles
      if (Math.abs(lat) > 75) continue;

      for (let j = 0; j < sampleLonSteps; j++) {
        const lon = -180 + (360 / sampleLonSteps) * j;
        
        // Algorithmic land/structure approximation filter based on spherical harmonics
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const noiseFactor = Math.sin(phi * 3.5) * Math.cos(theta * 3.5) + Math.sin(phi * 7.0 + theta * 4.0) * 0.5;

        // Keep points that roughly mirror continental clusters
        if (noiseFactor > -0.15) {
          points.push(latLonToVector3(lat, lon, globeRadius * 1.001));
        }
      }
    }
    return points;
  }, [globeRadius]);

  const pointsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(gridDots);
    return geometry;
  }, [gridDots]);

  // Update target rotation when a destination is selected
  React.useEffect(() => {
    if (selectedCity && globeGroupRef.current) {
      // Calculate target rotation so selected city faces camera (+Z)
      const targetPhi = (90 - selectedCity.latitude) * (Math.PI / 180);
      const targetTheta = (selectedCity.longitude + 180) * (Math.PI / 180);

      const targetY = -targetTheta + Math.PI / 2;
      const targetX = targetPhi - Math.PI / 2;

      targetRotationRef.current = { x: targetX * 0.4, y: targetY };
    }
  }, [selectedCity]);

  // Frame update: idle rotation or smooth lerp towards target
  useFrame((_, delta) => {
    if (!globeGroupRef.current) return;

    if (targetRotationRef.current) {
      // Smooth camera interpolation towards selected hub
      globeGroupRef.current.rotation.y = THREE.MathUtils.damp(
        globeGroupRef.current.rotation.y,
        targetRotationRef.current.y,
        3.5,
        delta
      );
      globeGroupRef.current.rotation.x = THREE.MathUtils.damp(
        globeGroupRef.current.rotation.x,
        targetRotationRef.current.x,
        3.5,
        delta
      );
    } else if (autoRotate && !hoveredCityId) {
      // Gentle idle spin
      globeGroupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={globeGroupRef}>
      {/* Deep Obsidian Core Sphere */}
      <mesh>
        <sphereGeometry args={[globeRadius, 64, 64]} />
        <meshStandardMaterial
          color="#0a0a0d"
          roughness={0.85}
          metalness={0.2}
          emissive="#060608"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Cartographic Latitude / Longitude Wire Rings */}
      <mesh>
        <sphereGeometry args={[globeRadius * 1.0005, 24, 16]} />
        <meshBasicMaterial
          color="#c5a880"
          wireframe
          transparent
          opacity={0.06}
        />
      </mesh>

      {/* Procedural Cartographic Data Points */}
      <points geometry={pointsGeometry}>
        <pointsMaterial
          size={0.018}
          color="#c5a880"
          transparent
          opacity={0.35}
          sizeAttenuation
        />
      </points>

      {/* Equator & Prime Reference Coordinate Rings */}
      <group>
        {/* Equator */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[globeRadius * 1.002, globeRadius * 1.004, 64]} />
          <meshBasicMaterial color="#c5a880" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
        {/* Prime Meridian */}
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[globeRadius * 1.002, globeRadius * 1.004, 64]} />
          <meshBasicMaterial color="#c5a880" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Interactive Global City Hub Markers */}
      {destinations.map((dest) => (
        <CityMarker
          key={dest.id}
          destination={dest}
          globeRadius={globeRadius}
          isHovered={hoveredCityId === dest.id}
          onHover={onHoverCity}
          onSelect={onSelectCity}
        />
      ))}

      {/* Outer Atmospheric Rim Glow */}
      <Atmosphere radius={globeRadius} />
    </group>
  );
};
