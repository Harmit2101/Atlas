import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CountryBeacon } from '@/services/countryBeacons';
import { latLonToVector3 } from './globeUtils';

interface CountryBeaconMarkerProps {
  beacon: CountryBeacon;
  globeRadius: number;
  isHovered: boolean;
  isSelected?: boolean;
  onHover: (countryCode: string | null) => void;
  onSelect: (beacon: CountryBeacon) => void;
}

export const CountryBeaconMarker: React.FC<CountryBeaconMarkerProps> = ({
  beacon,
  globeRadius,
  isHovered,
  isSelected = false,
  onHover,
  onSelect
}) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef<number>(Math.random() * 10);
  const [internalHover, setInternalHover] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempCameraDir = useMemo(() => new THREE.Vector3(), []);

  // Position on globe surface with tiny radial offset
  const position = useMemo(() => {
    return latLonToVector3(beacon.latitude, beacon.longitude, globeRadius * 1.0025);
  }, [beacon.latitude, beacon.longitude, globeRadius]);

  const lookAtTarget = useMemo(() => {
    return position.clone().multiplyScalar(1.25);
  }, [position]);

  // Determine if this beacon is on the hemisphere currently facing the camera
  const checkFacingCamera = useCallback(() => {
    if (!groupRef.current) return false;
    groupRef.current.getWorldPosition(tempPos);
    const normal = tempPos.clone().normalize();
    tempCameraDir.subVectors(camera.position, tempPos).normalize();
    return normal.dot(tempCameraDir) > 0.15;
  }, [camera, tempPos, tempCameraDir]);

  // Sync internal hover state with parent isHovered
  useEffect(() => {
    if (!isHovered) {
      setInternalHover(false);
    }
  }, [isHovered]);

  // Ensure cursor resets on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  const active = (isHovered || internalHover || isSelected) && isVisible;

  // Frame update: monitor hemisphere visibility and pulse ring
  useFrame((_, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;

    const facing = checkFacingCamera();
    if (facing !== isVisible) {
      setIsVisible(facing);
    }

    // Auto-clear hover if marker rotates into the back hemisphere
    if (!facing && (internalHover || isHovered)) {
      setInternalHover(false);
      if (isHovered) {
        onHover(null);
        document.body.style.cursor = 'auto';
      }
    }

    if (ringRef.current) {
      const pulseSpeed = isSelected ? 4.5 : active ? 3.5 : 2.0;
      const baseScale = isSelected ? 1.5 : active ? 1.3 : 1.0;
      const scale = baseScale + Math.sin(time * pulseSpeed) * 0.15;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      visible={isVisible}
    >
      <group onUpdate={(self) => self.lookAt(lookAtTarget)}>
        {/* Dedicated Invisible Hit Testing Disc strictly over the country dot */}
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!checkFacingCamera()) return;
            setInternalHover(true);
            onHover(beacon.country);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setInternalHover(false);
            onHover(null);
            document.body.style.cursor = 'auto';
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!checkFacingCamera()) return;
            onSelect(beacon);
          }}
        >
          <circleGeometry args={[0.048, 16]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Core Dot: Sovereign Amber Core (pure visual, raycast disabled) */}
        <mesh raycast={() => null}>
          <circleGeometry args={[isSelected ? 0.026 : active ? 0.022 : 0.016, 16]} />
          <meshBasicMaterial
            color={isSelected ? '#ffffff' : active ? '#f4f2ec' : '#c5a880'}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Pulsing Atmosphere Ring (pure visual, raycast disabled to prevent gap/pulse flickering) */}
        <mesh ref={ringRef} raycast={() => null}>
          <ringGeometry args={[0.020, 0.030, 24]} />
          <meshBasicMaterial
            color={isSelected ? '#f4f2ec' : active ? '#e2c295' : '#c5a880'}
            transparent
            opacity={isSelected ? 0.95 : active ? 0.85 : 0.45}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Sovereign Light Stylus / Pillar (pure visual, raycast disabled to prevent sky-high line hits) */}
        <line
          ref={(node: any) => {
            if (node) node.raycast = () => null;
          }}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, 0, isSelected ? 0.14 : active ? 0.10 : 0.05]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={isSelected ? '#ffffff' : '#c5a880'}
            transparent
            opacity={isSelected ? 0.95 : active ? 0.8 : 0.35}
          />
        </line>

        {/* Precision Compact Sovereign Badge on Hover */}
        {active && (
          <Html
            position={[0, 0, isSelected ? 0.16 : 0.12]}
            center
            zIndexRange={[150, 0]}
            style={{
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            <div className="flex flex-col gap-0.5 bg-[#08080a]/95 backdrop-blur-md border border-[#c5a880]/60 rounded px-2.5 py-1.5 shadow-2xl text-left w-max max-w-[160px] pointer-events-none select-none">
              <div className="flex items-center justify-between gap-2">
                <span className="font-editorial text-[11px] font-semibold text-[#f4f2ec] truncate">
                  {beacon.countryName}
                </span>
                <span className="text-[8px] font-mono-luxury text-[#c5a880] px-1 py-0.2 rounded bg-white/10 font-bold">
                  {beacon.country}
                </span>
              </div>
              <div className="text-[9.5px] font-mono-luxury text-[#c5a880] font-medium">
                {beacon.listingCount.toLocaleString()} Live MLS
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono-luxury text-[#8e8d93] pt-0.5 border-t border-white/10">
                <span>Score {beacon.score}</span>
                <span className="text-[#c5a880] font-medium">Grade {beacon.grade}</span>
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};
