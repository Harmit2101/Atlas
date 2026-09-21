import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';

interface AtmosphereProps {
  radius?: number;
}

export const Atmosphere: React.FC<AtmosphereProps> = ({ radius = 1.55 }) => {
  // Ultra-subtle limb halo that strictly decays to 0 at the horizon and stays well within viewport
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float viewDot = dot(vNormal, vec3(0.0, 0.0, 1.0));
          // Peaks strictly at the tangential limb
          float intensity = pow(clamp(1.0 - abs(viewDot), 0.0, 1.0), 3.8);
          vec3 rimColor = mix(vec3(0.28, 0.44, 0.65), vec3(0.77, 0.66, 0.50), 0.35);
          gl_FragColor = vec4(rimColor, intensity * 0.35);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
  }, []);

  useEffect(() => {
    return () => {
      atmosphereMaterial.dispose();
    };
  }, [atmosphereMaterial]);

  return (
    <mesh material={atmosphereMaterial}>
      <sphereGeometry args={[radius * 1.025, 48, 48]} />
    </mesh>
  );
};
