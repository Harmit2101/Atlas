import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AtlasProperty } from '@/types/property';
import { CountryBeacon } from '@/services/countryBeacons';
import { PropertyMarker } from './PropertyMarker';
import { CountryBeaconMarker } from './CountryBeaconMarker';
import { Atmosphere } from './Atmosphere';
import { isValidCoordinate } from '@/services/destinationService';
import { latLonToVector3 } from './globeUtils';

interface GlobeProps {
  properties?: AtlasProperty[];
  countryBeacons?: CountryBeacon[];
  globeRadius?: number;
  hoveredId: string | null;
  selectedPropertyId?: string | null;
  selectedCountryCode?: string | null;
  onHoverId: (id: string | null) => void;
  onSelectProperty?: (property: AtlasProperty) => void;
  onSelectCountry?: (beacon: CountryBeacon) => void;
  autoRotate?: boolean;
  groupRef?: React.RefObject<THREE.Group | null>;
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

// Fragment shader combining NASA day topography, specular oceans, and night lights
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
      float rim = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
      gl_FragColor = vec4(vec3(0.04, 0.04, 0.05) + vec3(0.77, 0.66, 0.50) * rim * 0.4, 1.0);
      return;
    }

    vec4 daySample = texture2D(uDayMap, vUv);
    vec4 nightSample = texture2D(uNightMap, vUv);
    vec4 specSample = texture2D(uSpecularMap, vUv);

    float isWater = specSample.r;
    float isLand = 1.0 - isWater;

    float NdotL = dot(normal, uSunDirection);
    float dayFactor = smoothstep(-0.25, 0.45, NdotL);
    float nightFactor = 1.0 - smoothstep(-0.15, 0.30, NdotL);

    vec3 deepOcean = vec3(0.020, 0.024, 0.034);
    vec3 shallowOcean = vec3(0.035, 0.048, 0.065);
    vec3 oceanColor = mix(deepOcean, shallowOcean, daySample.b * 0.4);

    float landLuminance = dot(daySample.rgb, vec3(0.299, 0.587, 0.114));
    vec3 landBase = vec3(0.055, 0.058, 0.070);
    vec3 landHighlight = vec3(0.22, 0.20, 0.18);
    vec3 landColor = mix(landBase, landHighlight, pow(landLuminance, 1.1) * 1.35);

    vec3 surface = mix(landColor, oceanColor, isWater);

    vec3 halfVec = normalize(uSunDirection + viewDir);
    float NdotH = max(dot(normal, halfVec), 0.0);
    float specular = pow(NdotH, 28.0) * isWater * 0.28;

    float cityLights = nightSample.r * isLand;
    vec3 cityColor = vec3(0.92, 0.78, 0.55) * cityLights * 1.6;

    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.2);
    vec3 rimColor = mix(vec3(0.30, 0.45, 0.65), vec3(0.77, 0.66, 0.50), 0.40) * fresnel * 0.55;

    vec3 finalColor = surface * (0.32 + dayFactor * 0.68);
    finalColor += cityColor * (0.5 + nightFactor * 0.85);
    finalColor += vec3(0.77, 0.66, 0.50) * specular;
    finalColor += rimColor;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const Globe: React.FC<GlobeProps> = ({
  properties = [],
  countryBeacons = [],
  globeRadius = 1.55,
  hoveredId,
  selectedPropertyId,
  selectedCountryCode,
  onHoverId,
  onSelectProperty,
  onSelectCountry,
  autoRotate = true,
  groupRef
}) => {
  const internalGroupRef = useRef<THREE.Group>(null);
  const globeGroupRef = (groupRef || internalGroupRef) as React.RefObject<THREE.Group>;
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const timeRef = useRef<number>(0);

  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const texturesRef = useRef<{
    day: THREE.Texture | null;
    night: THREE.Texture | null;
    spec: THREE.Texture | null;
  }>({ day: null, night: null, spec: null });

  // Custom Earth material using physical lighting shaders
  const earthMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        uDayMap: { value: null },
        uNightMap: { value: null },
        uSpecularMap: { value: null },
        uSunDirection: { value: new THREE.Vector3(1.2, 0.8, 1.4).normalize() },
        uTime: { value: 0 },
        uTextureLoaded: { value: 0.0 }
      },
      transparent: false
    });
  }, []);

  // Async texture loading pipeline with graceful fallbacks
  useEffect(() => {
    let isMounted = true;
    const textureLoader = new THREE.TextureLoader();

    const loadTextureAsync = (url: string): Promise<THREE.Texture> => {
      return new Promise((resolve, reject) => {
        textureLoader.load(url, resolve, undefined, reject);
      });
    };

    Promise.all([
      loadTextureAsync('/textures/earth_day_2048.jpg'),
      loadTextureAsync('/textures/earth_lights_2048.png'),
      loadTextureAsync('/textures/earth_specular_2048.jpg')
    ])
      .then(([day, night, spec]) => {
        if (!isMounted) return;

        day.colorSpace = THREE.SRGBColorSpace;
        night.colorSpace = THREE.SRGBColorSpace;
        spec.colorSpace = THREE.NoColorSpace;

        texturesRef.current = { day, night, spec };
        setTexturesLoaded(true);
      })
      .catch(() => {
        // Fallback gracefully to high-contrast monochrome terrain
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update uniforms when textures are ready
  useEffect(() => {
    if (texturesLoaded && texturesRef.current.day) {
      earthMaterial.uniforms.uDayMap.value = texturesRef.current.day;
      earthMaterial.uniforms.uNightMap.value = texturesRef.current.night;
      earthMaterial.uniforms.uSpecularMap.value = texturesRef.current.spec;
      earthMaterial.uniforms.uTextureLoaded.value = 1.0;
      earthMaterial.needsUpdate = true;
    }
  }, [texturesLoaded, earthMaterial]);

  // Valid geocoded properties strictly from current live inventory
  const geocodedProperties = useMemo(() => {
    return properties.filter(p => isValidCoordinate(p.latitude, p.longitude));
  }, [properties]);

  // Handle click on the Earth sphere surface to detect and select the nearest country
  const handleGlobeClick = useCallback((worldPoint: THREE.Vector3) => {
    if (!globeGroupRef.current || !countryBeacons.length || !onSelectCountry) return;

    // Convert click point in world space to globe group local space
    const localPoint = globeGroupRef.current.worldToLocal(worldPoint.clone());

    let closestBeacon: CountryBeacon | null = null;
    let minDistance = Infinity;

    for (const beacon of countryBeacons) {
      const beaconPos = latLonToVector3(beacon.latitude, beacon.longitude, globeRadius);
      const dist = localPoint.distanceTo(beaconPos);
      if (dist < minDistance) {
        minDistance = dist;
        closestBeacon = beacon;
      }
    }

    // Radius 1.55: distance < 0.85 covers any click within ~30 degrees of a country centroid
    if (closestBeacon && minDistance < 0.85) {
      onSelectCountry(closestBeacon);
    }
  }, [countryBeacons, globeRadius, onSelectCountry, globeGroupRef]);

  // Frame update: calm continuous planetary rotation when idling in global orbit
  useFrame((_, delta) => {
    timeRef.current += delta;
    earthMaterial.uniforms.uTime.value = timeRef.current;

    if (!globeGroupRef.current) return;

    if (autoRotate && !hoveredId && !selectedPropertyId && !selectedCountryCode) {
      globeGroupRef.current.rotation.y += delta * 0.07;
    }
  });

  // Visual Fan Dispersion:
  // When multiple live properties share identical coordinates from an agency,
  // apply a deterministic, tiny visual fan offset ONLY for rendering.
  // The underlying canonical property.latitude and longitude remain 100% untouched.
  const dispersedProperties = useMemo(() => {
    const coordsMap = new Map<string, AtlasProperty[]>();
    for (const p of geocodedProperties) {
      const key = `${p.latitude.toFixed(4)}_${p.longitude.toFixed(4)}`;
      if (!coordsMap.has(key)) coordsMap.set(key, []);
      coordsMap.get(key)!.push(p);
    }

    const result: Array<{ property: AtlasProperty; displayLat: number; displayLng: number }> = [];

    coordsMap.forEach((group) => {
      if (group.length === 1) {
        result.push({
          property: group[0],
          displayLat: group[0].latitude,
          displayLng: group[0].longitude
        });
      } else {
        const count = group.length;
        group.forEach((prop, i) => {
          const angle = (i / count) * 2 * Math.PI;
          const offsetDegree = 0.0022; // ~200m visual fan so all dots remain individually visible
          result.push({
            property: prop,
            displayLat: prop.latitude + Math.sin(angle) * offsetDegree,
            displayLng: prop.longitude + Math.cos(angle) * offsetDegree
          });
        });
      }
    });

    return result;
  }, [geocodedProperties, properties]);

  return (
    <group ref={globeGroupRef}>
      {/* Real Earth Sphere with Topography & Night Lights */}
      <mesh
        material={earthMaterial}
        onPointerDown={(e) => {
          pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
          const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
          // Distinguish genuine click from mouse drag (> 6px)
          if (dx > 6 || dy > 6) return;
          e.stopPropagation();
          handleGlobeClick(e.point);
        }}
        onPointerMove={(e) => {
          // Stop ray from penetrating through planet to backside markers
          e.stopPropagation();
        }}
      >
        <sphereGeometry args={[globeRadius, 64, 64]} />
      </mesh>

      {/* Cartography reference lines (pure visual, raycast disabled) */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[globeRadius * 1.0008, 36, 18]} />
        <meshBasicMaterial
          color="#c5a880"
          wireframe
          transparent
          opacity={0.04}
        />
      </mesh>

      {/* Equator Coordinate Ring (pure visual, raycast disabled) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[globeRadius * 1.0012, globeRadius * 1.0025, 64]} />
        <meshBasicMaterial color="#c5a880" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* ====================================================
          SOVEREIGN JURISDICTION BEACONS (78+ COUNTRIES)
          Every tracked sovereign nation is illuminated with a
          golden beacon and interactive teleporter.
          ==================================================== */}
      {countryBeacons.map((beacon) => (
        <CountryBeaconMarker
          key={`beacon-${beacon.country}`}
          beacon={beacon}
          globeRadius={globeRadius}
          isHovered={hoveredId === beacon.country}
          isSelected={selectedCountryCode?.toUpperCase() === beacon.country.toUpperCase()}
          onHover={onHoverId}
          onSelect={(b) => {
            if (onSelectCountry) onSelectCountry(b);
          }}
        />
      ))}

      {/* ====================================================
          PURE LIVE PROPERTY CARTOGRAPHY (ZERO CLUSTERS)
          ==================================================== */}
      {dispersedProperties.map(({ property, displayLat, displayLng }) => {
        // Visual proxy with fan dispersion coordinates (canonical property data untouched)
        const renderProperty: AtlasProperty = {
          ...property,
          latitude: displayLat,
          longitude: displayLng
        };

        return (
          <PropertyMarker
            key={`prop-${property.id}`}
            property={renderProperty}
            globeRadius={globeRadius}
            isHovered={hoveredId === property.id}
            isSelected={selectedPropertyId === property.id}
            onHover={onHoverId}
            onSelect={onSelectProperty || (() => {})}
          />
        );
      })}

      {/* Soft Ethereal Atmospheric Glow */}
      <Atmosphere radius={globeRadius} />
    </group>
  );
};
