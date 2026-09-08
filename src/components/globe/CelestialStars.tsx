import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface CelestialStarsProps {
  radius?: number;
  depth?: number;
  count?: number;
  speed?: number;
}

export const CelestialStars: React.FC<CelestialStarsProps> = ({
  radius = 40,
  depth = 20,
  count = 500,
  speed = 0.25
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef<number>(0);

  const [positions, colors] = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const r = radius + Math.random() * depth;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      pos.push(x, y, z);

      // Subtle warm champagne to cool starlight
      const temp = Math.random();
      if (temp > 0.8) {
        color.setRGB(0.95, 0.88, 0.75); // Warm champagne
      } else if (temp > 0.5) {
        color.setRGB(0.85, 0.90, 1.00); // Pale diamond
      } else {
        color.setRGB(0.70, 0.72, 0.78); // Dim stellar dust
      }
      col.push(color.r, color.g, color.b);
    }

    return [new Float32Array(pos), new Float32Array(col)];
  }, [radius, depth, count]);

  // Gentle subtle twinkling using delta (NO THREE.Clock deprecation)
  useFrame((_, delta) => {
    timeRef.current += delta * speed;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = timeRef.current * 0.015;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
