import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Destination } from '@/types/destination';
import { CityLabel } from './CityLabel';

interface CityMarkerProps {
  destination: Destination;
  globeRadius: number;
  isHovered: boolean;
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
  onHover,
  onSelect
}) => {
  const markerGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [internalHover, setInternalHover] = useState(false);

  const active = isHovered || internalHover;

  // Calculate position and normal orientation
  const position = useMemo(() => {
    return latLonToVector3(destination.latitude, destination.longitude, globeRadius * 1.002);
  }, [destination.latitude, destination.longitude, globeRadius]);

  const lookAtTarget = useMemo(() => {
    return position.clone().multiplyScalar(1.2);
  }, [position]);

  // Subtle pulsing animation on the outer marker ring
  useFrame(({ clock }) => {
    if (ringRef.current) {
      const time = clock.getElapsedTime();
      const scale = active 
        ? 1.4 + Math.sin(time * 4) * 0.25 
        : 1.0 + Math.sin(time * 2 + destination.latitude) * 0.15;
      ringRef.current.scale.set(scale, scale, scale);
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
        {/* Central Core Dot */}
        <mesh>
          <circleGeometry args={[active ? 0.045 : 0.03, 16]} />
          <meshBasicMaterial 
            color={active ? '#f4f2ec' : '#c5a880'} 
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer Glow Ring */}
        <mesh ref={ringRef}>
          <ringGeometry args={[0.04, 0.06, 24]} />
          <meshBasicMaterial 
            color="#e2c295" 
            transparent 
            opacity={active ? 0.9 : 0.45} 
            side={THREE.DoubleSide} 
          />
        </mesh>

        {/* Vertical beacon line projecting outward */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, 0, active ? 0.18 : 0.08]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color="#c5a880" 
            transparent 
            opacity={active ? 0.8 : 0.35} 
          />
        </line>
      </group>

      {/* 3D HTML Billboard Label on hover */}
      <CityLabel 
        destination={destination} 
        visible={active} 
        onClick={() => onSelect(destination)} 
      />
    </group>
  );
};
