import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Destination } from '@/types/destination';
import { CityLabel } from './CityLabel';

interface CityMarkerProps {
  destination: Destination;
  globeRadius: number;
  isHovered: boolean;
  isSelected?: boolean;
  onHover: (id: string | null) => void;
  onSelect: (destination: Destination) => void;
}

// Convert lat/lon to 3D Cartesian coordinates
export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const CityMarker: React.FC<CityMarkerProps> = ({
  destination,
  globeRadius,
  isHovered,
  isSelected = false,
  onHover,
  onSelect
}) => {
  const markerGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const outerPulseRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef<number>(0);
  const [internalHover, setInternalHover] = useState(false);

  const active = isHovered || internalHover || isSelected;

  // Calculate position and normal orientation
  const position = useMemo(() => {
    return latLonToVector3(destination.latitude, destination.longitude, globeRadius * 1.002);
  }, [destination.latitude, destination.longitude, globeRadius]);

  const lookAtTarget = useMemo(() => {
    return position.clone().multiplyScalar(1.2);
  }, [position]);

  // Subtle pulsing animation on marker rings (NO THREE.Clock deprecation)
  useFrame((_, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;

    if (ringRef.current) {
      const scale = isSelected
        ? 1.5 + Math.sin(time * 5) * 0.3
        : active 
        ? 1.35 + Math.sin(time * 4) * 0.2 
        : 1.0 + Math.sin(time * 2.2 + destination.latitude) * 0.12;
      ringRef.current.scale.set(scale, scale, scale);
    }

    if (outerPulseRef.current && (isSelected || active)) {
      const pulseProgress = (time * 1.5) % 1.0;
      const pulseScale = 1.0 + pulseProgress * 1.8;
      outerPulseRef.current.scale.set(pulseScale, pulseScale, pulseScale);
      if (outerPulseRef.current.material instanceof THREE.Material) {
        outerPulseRef.current.material.opacity = (1.0 - pulseProgress) * 0.6;
      }
    }
  });

  return (
    <group 
      ref={markerGroupRef} 
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setInternalHover(true);
        onHover(destination.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setInternalHover(false);
        onHover(null);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(destination);
      }}
    >
      {/* Align normal to point outward from globe center */}
      <group onUpdate={(self) => self.lookAt(lookAtTarget)}>
        {/* Central Radiant Core Dot */}
        <mesh>
          <circleGeometry args={[isSelected ? 0.048 : active ? 0.040 : 0.026, 20]} />
          <meshBasicMaterial 
            color={isSelected ? '#ffffff' : active ? '#f4f2ec' : '#c5a880'} 
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Primary Glow Ring */}
        <mesh ref={ringRef}>
          <ringGeometry args={[0.035, 0.052, 24]} />
          <meshBasicMaterial 
            color={isSelected ? '#e2c295' : '#c5a880'} 
            transparent 
            opacity={isSelected ? 0.95 : active ? 0.85 : 0.40} 
            side={THREE.DoubleSide} 
          />
        </mesh>

        {/* Expanding Outer Radar Ring on active/selected */}
        {(isSelected || active) && (
          <mesh ref={outerPulseRef}>
            <ringGeometry args={[0.055, 0.068, 24]} />
            <meshBasicMaterial 
              color="#c5a880" 
              transparent 
              opacity={0.5} 
              side={THREE.DoubleSide} 
            />
          </mesh>
        )}

        {/* Vertical beacon line projecting outward from planet */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, 0, isSelected ? 0.24 : active ? 0.16 : 0.07]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color={isSelected ? '#ffffff' : '#c5a880'} 
            transparent 
            opacity={isSelected ? 0.95 : active ? 0.80 : 0.30} 
          />
        </line>
      </group>

      {/* 3D HTML Billboard Label on hover or selected */}
      <CityLabel 
        destination={destination} 
        visible={active} 
        isSelected={isSelected}
        onClick={() => onSelect(destination)} 
      />
    </group>
  );
};
