import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Destination } from '@/types/destination';
import { CityMarker } from './CityMarker';
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

// Vertex shader for cinematic Earth sphere
const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader: combines real NASA day topography, specular ocean mask, and night city lights
// into Atlas's signature dark luxury editorial palette
const earthFragmentShader = `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform sampler2D uSpecularMap;
  uniform vec3 uSunDirection;
  uniform float uTime;
  uniform float uTextureLoaded;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vPosition);

    if (uTextureLoaded < 0.5) {
      // Fallback elegant dark sphere while textures stream in
      float rim = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
      gl_FragColor = vec4(vec3(0.04, 0.04, 0.05) + vec3(0.77, 0.66, 0.50) * rim * 0.4, 1.0);
      return;
    }

    // Sample real geographic textures
    vec4 daySample = texture2D(uDayMap, vUv);
    vec4 nightSample = texture2D(uNightMap, vUv);
    vec4 specSample = texture2D(uSpecularMap, vUv);

    // In Three.js earth_specular, ocean is white (~1.0), land is dark (~0.0)
    float isWater = specSample.r;
    float isLand = 1.0 - isWater;

    // Cinematic lighting (sunlight vector)
    float NdotL = dot(normal, uSunDirection);
    float dayFactor = smoothstep(-0.25, 0.45, NdotL);
    float nightFactor = 1.0 - smoothstep(-0.15, 0.30, NdotL);

    // 1. Midnight Obsidian Oceans
    vec3 deepOcean = vec3(0.020, 0.024, 0.034);
    vec3 shallowOcean = vec3(0.035, 0.048, 0.065);
    vec3 oceanColor = mix(deepOcean, shallowOcean, daySample.b * 0.4);

    // 2. Realistic Landmass Topography (Dark Luxury Palette)
    // Continents are clearly recognizable across Europe, Africa, Asia, Americas, Australia
    float landLuminance = dot(daySample.rgb, vec3(0.299, 0.587, 0.114));
    vec3 landBase = vec3(0.055, 0.058, 0.070); // Deep graphite mantle
    vec3 landHighlight = vec3(0.22, 0.20, 0.18); // Warm titanium topography
    vec3 landColor = mix(landBase, landHighlight, pow(landLuminance, 1.1) * 1.35);

    // Base surface combines recognizable continents and midnight oceans
    vec3 surface = mix(landColor, oceanColor, isWater);

    // 3. Subtle Ocean Specular Sheen (sun reflection on water)
    vec3 halfVec = normalize(uSunDirection + viewDir);
    float NdotH = max(dot(normal, halfVec), 0.0);
    float specular = pow(NdotH, 28.0) * isWater * 0.28;

    // 4. Real Metropolitan City Lights (warm champagne gold)
    float cityLights = nightSample.r * isLand;
    vec3 cityColor = vec3(0.92, 0.78, 0.55) * cityLights * 1.6;

    // 5. Atmospheric Fresnel Rim (champagne & azure horizon)
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.2);
    vec3 rimColor = mix(vec3(0.30, 0.45, 0.65), vec3(0.77, 0.66, 0.50), 0.40) * fresnel * 0.55;

    // Blend final cinematic layers
    vec3 finalColor = surface * (0.32 + dayFactor * 0.68);
    finalColor += cityColor * (0.5 + nightFactor * 0.85);
    finalColor += vec3(0.77, 0.66, 0.50) * specular;
    finalColor += rimColor;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const Globe: React.FC<GlobeProps> = ({
  destinations,
  globeRadius = 1.55,
  hoveredCityId,
  selectedCity,
  onHoverCity,
  onSelectCity,
  autoRotate = true
}) => {
  const globeGroupRef = useRef<THREE.Group>(null);
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);
  const timeRef = useRef<number>(0);

  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const texturesRef = useRef<{
    day: THREE.Texture | null;
    night: THREE.Texture | null;
    spec: THREE.Texture | null;
  }>({ day: null, night: null, spec: null });

  // Load real NASA/Three.js Earth geographic textures asynchronously
  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();

    Promise.all([
      loader.loadAsync('/textures/earth_day_2048.jpg'),
      loader.loadAsync('/textures/earth_lights_2048.png'),
      loader.loadAsync('/textures/earth_specular_2048.jpg')
    ]).then(([day, night, spec]) => {
      if (!active) {
        day.dispose();
        night.dispose();
        spec.dispose();
        return;
      }
      day.colorSpace = THREE.SRGBColorSpace;
      night.colorSpace = THREE.SRGBColorSpace;
      spec.colorSpace = THREE.NoColorSpace;

      texturesRef.current = { day, night, spec };
      setTexturesLoaded(true);
    }).catch((err) => {
      console.warn('[ATLAS] Earth textures background load error, falling back to shader procedural mode:', err);
    });

    return () => {
      active = false;
      texturesRef.current.day?.dispose();
      texturesRef.current.night?.dispose();
      texturesRef.current.spec?.dispose();
    };
  }, []);

  // Earth Shader Material instance
  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uDayMap: { value: null },
        uNightMap: { value: null },
        uSpecularMap: { value: null },
        uSunDirection: { value: new THREE.Vector3(1.3, 0.8, 1.1).normalize() },
        uTime: { value: 0 },
        uTextureLoaded: { value: 0.0 }
      },
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      transparent: false
    });
  }, []);

  // Update material uniforms when textures finish loading
  useEffect(() => {
    if (texturesLoaded && texturesRef.current.day) {
      earthMaterial.uniforms.uDayMap.value = texturesRef.current.day;
      earthMaterial.uniforms.uNightMap.value = texturesRef.current.night;
      earthMaterial.uniforms.uSpecularMap.value = texturesRef.current.spec;
      earthMaterial.uniforms.uTextureLoaded.value = 1.0;
      earthMaterial.needsUpdate = true;
    }
  }, [texturesLoaded, earthMaterial]);

  // Update target rotation when a destination is selected
  useEffect(() => {
    if (selectedCity && globeGroupRef.current) {
      // Calculate target rotation so selected city faces camera (+Z)
      const targetPhi = (90 - selectedCity.latitude) * (Math.PI / 180);
      const targetTheta = (selectedCity.longitude + 180) * (Math.PI / 180);

      const targetY = -targetTheta + Math.PI / 2;
      const targetX = targetPhi - Math.PI / 2;

      targetRotationRef.current = { x: targetX * 0.35, y: targetY };
    }
  }, [selectedCity]);

  // Frame update: smooth rotation damping (accumulating delta, NO THREE.Clock deprecation)
  useFrame((_, delta) => {
    timeRef.current += delta;
    earthMaterial.uniforms.uTime.value = timeRef.current;

    if (!globeGroupRef.current) return;

    if (targetRotationRef.current) {
      // Shortest angle difference on Y axis to prevent unnecessary full spins
      const currentY = globeGroupRef.current.rotation.y;
      const targetY = targetRotationRef.current.y;
      const diffY = Math.atan2(Math.sin(targetY - currentY), Math.cos(targetY - currentY));

      globeGroupRef.current.rotation.y = THREE.MathUtils.damp(
        currentY,
        currentY + diffY,
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
      // Gentle cinematic idle rotation
      globeGroupRef.current.rotation.y += delta * 0.07;
    }
  });

  return (
    <group ref={globeGroupRef}>
      {/* Real Earth Sphere with Geographic Continents & City Lights */}
      <mesh material={earthMaterial}>
        <sphereGeometry args={[globeRadius, 64, 64]} />
      </mesh>

      {/* Subtle Reference Latitude / Longitude Cartography Lines (Secondary Layer) */}
      <mesh>
        <sphereGeometry args={[globeRadius * 1.0008, 36, 18]} />
        <meshBasicMaterial
          color="#c5a880"
          wireframe
          transparent
          opacity={0.045}
        />
      </mesh>

      {/* Equator Coordinate Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[globeRadius * 1.0012, globeRadius * 1.0028, 64]} />
        <meshBasicMaterial color="#c5a880" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Live Property Location & Hub Markers */}
      {destinations.map((dest) => (
        <CityMarker
          key={dest.id}
          destination={dest}
          globeRadius={globeRadius}
          isHovered={hoveredCityId === dest.id}
          isSelected={selectedCity?.id === dest.id || selectedCity?.name === dest.name}
          onHover={onHoverCity}
          onSelect={onSelectCity}
        />
      ))}

      {/* Soft Ethereal Atmospheric Glow (seamlessly fading into dark page) */}
      <Atmosphere radius={globeRadius} />
    </group>
  );
};
