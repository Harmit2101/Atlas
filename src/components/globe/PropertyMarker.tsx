import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { AtlasProperty } from '@/types/property';
import { latLonToVector3 } from './globeUtils';

interface PropertyMarkerProps {
  property: AtlasProperty;
  globeRadius: number;
  isHovered: boolean;
  isSelected?: boolean;
  onHover: (id: string | null) => void;
  onSelect: (property: AtlasProperty) => void;
}

export const PropertyMarker: React.FC<PropertyMarkerProps> = ({
  property,
  globeRadius,
  isHovered,
  isSelected = false,
  onHover,
  onSelect
}) => {
  const markerGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef<number>(0);
  const [internalHover, setInternalHover] = useState(false);

  const active = isHovered || internalHover || isSelected;

  // Calculate 3D Cartesian position on Earth sphere surface
  const position = useMemo(() => {
    return latLonToVector3(property.latitude, property.longitude, globeRadius * 1.002);
  }, [property.latitude, property.longitude, globeRadius]);

  const lookAtTarget = useMemo(() => {
    return position.clone().multiplyScalar(1.25);
  }, [position]);

  // Subtle pulsing animation on marker halo
  useFrame((_, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;

    if (ringRef.current) {
      const scale = isSelected
        ? 1.4 + Math.sin(time * 5) * 0.2
        : active
        ? 1.25 + Math.sin(time * 4) * 0.12
        : 1.0 + Math.sin(time * 2.2 + property.latitude * 4) * 0.08;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  // Clean, real location display: e.g. "Spintex, Accra, Ghana" or "Altidona, Italy"
  const locationText = useMemo(() => {
    if (property.displayLocation) return property.displayLocation;
    if (property.locality && property.city) return `${property.locality}, ${property.city}, ${property.country}`;
    if (property.city) return `${property.city}, ${property.country}`;
    return property.country;
  }, [property]);

  return (
    <group
      ref={markerGroupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setInternalHover(true);
        onHover(property.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setInternalHover(false);
        onHover(null);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(property);
      }}
    >
      {/* Align normal pointing outward from planet center */}
      <group onUpdate={(self) => self.lookAt(lookAtTarget)}>
        {/* Core Dot (Tiny warm-gold luxury cartographic point) */}
        <mesh>
          <circleGeometry args={[isSelected ? 0.024 : active ? 0.020 : 0.014, 16]} />
          <meshBasicMaterial
            color={isSelected ? '#ffffff' : active ? '#f4f2ec' : '#c5a880'}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Micro-Halo Ring */}
        <mesh ref={ringRef}>
          <ringGeometry args={[0.018, 0.026, 20]} />
          <meshBasicMaterial
            color={isSelected ? '#e2c295' : '#c5a880'}
            transparent
            opacity={isSelected ? 0.95 : active ? 0.85 : 0.45}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Thin, refined beacon line */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, 0, isSelected ? 0.12 : active ? 0.09 : 0.04]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={isSelected ? '#ffffff' : '#c5a880'}
            transparent
            opacity={isSelected ? 0.9 : active ? 0.75 : 0.3}
          />
        </line>

        {/* Minimalist, Lightweight Hover Label Anchored Near Beacon Tip */}
        {active && (
          <Html
            position={[0, 0, isSelected ? 0.14 : 0.11]}
            center
            distanceFactor={6}
            zIndexRange={[150, 0]}
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
              transition: 'opacity 0.15s ease-out, transform 0.15s ease-out'
            }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelect(property);
              }}
              className="cursor-pointer group flex flex-col items-center bg-[#08080a]/92 backdrop-blur-md border border-[#c5a880]/60 hover:border-[#c5a880] rounded-sm px-2.5 py-1 shadow-2xl transition-all hover:scale-105"
            >
              {/* Clean property title */}
              <div className="text-[9.5px] font-mono-luxury font-medium text-[#f4f2ec] tracking-wide whitespace-nowrap max-w-[200px] truncate uppercase">
                {property.title}
              </div>

              {/* Verified real location */}
              <div className="text-[8px] font-mono-luxury text-[#c5a880] tracking-wider uppercase whitespace-nowrap pt-0.5">
                {locationText}
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};
