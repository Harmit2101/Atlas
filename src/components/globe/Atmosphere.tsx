import React, { useMemo } from 'react';
import * as THREE from 'three';

interface AtmosphereProps {
  radius?: number;
}

export const Atmosphere: React.FC<AtmosphereProps> = ({ radius = 2.05 }) => {
  // Custom subtle Fresnel atmosphere shader
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
          // Fresnel rim effect
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          // Subtle warm champagne gold rim glow
          vec3 atmosphereColor = vec3(0.77, 0.66, 0.50);
          gl_FragColor = vec4(atmosphereColor, intensity * 0.45);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
  }, []);

  return (
    <mesh material={atmosphereMaterial}>
      <sphereGeometry args={[radius * 1.15, 48, 48]} />
    </mesh>
  );
};
