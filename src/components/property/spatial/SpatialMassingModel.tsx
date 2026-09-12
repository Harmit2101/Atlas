import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpatialEnvelopeMetrics } from './spatialMath';

interface SpatialMassingModelProps {
  metrics: SpatialEnvelopeMetrics;
  activeZoneId?: string | null;
  onZoneHover?: (zoneId: string | null) => void;
}

export const SpatialMassingModel: React.FC<SpatialMassingModelProps> = ({
  metrics,
  activeZoneId,
  onZoneHover
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { width, height, depth } = metrics.dimensions;

  // Gentle subtle rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  // Procedural Materials & Geometries
  const materials = useMemo(() => {
    return {
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x1a1a24,
        transmission: 0.85,
        opacity: 0.35,
        transparent: true,
        roughness: 0.15,
        ior: 1.4,
        metalness: 0.1,
        depthWrite: false
      }),
      activeGlass: new THREE.MeshPhysicalMaterial({
        color: 0xc5a880,
        transmission: 0.65,
        opacity: 0.55,
        transparent: true,
        roughness: 0.2,
        emissive: 0xc5a880,
        emissiveIntensity: 0.2,
        depthWrite: false
      }),
      wireframe: new THREE.LineBasicMaterial({
        color: 0xc5a880,
        transparent: true,
        opacity: 0.75,
        linewidth: 1
      }),
      zoneWireframe: new THREE.LineBasicMaterial({
        color: 0x8e8d93,
        transparent: true,
        opacity: 0.45
      }),
      floorSlab: new THREE.MeshStandardMaterial({
        color: 0x111116,
        roughness: 0.5,
        metalness: 0.3
      }),
      groundRing: new THREE.LineBasicMaterial({
        color: 0xc5a880,
        transparent: true,
        opacity: 0.25
      })
    };
  }, []);

  // Dispose materials on unmount
  React.useEffect(() => {
    return () => {
      Object.values(materials).forEach(m => m.dispose());
    };
  }, [materials]);

  // Edges geometry for main volume
  const mainBoxGeo = useMemo(() => new THREE.BoxGeometry(width, height, depth), [width, height, depth]);
  const mainEdgesGeo = useMemo(() => new THREE.EdgesGeometry(mainBoxGeo), [mainBoxGeo]);

  React.useEffect(() => {
    return () => {
      mainBoxGeo.dispose();
      mainEdgesGeo.dispose();
    };
  }, [mainBoxGeo, mainEdgesGeo]);

  // Floor intermediate slabs
  const slabs = useMemo(() => {
    const list = [];
    for (let f = 0; f <= metrics.floorCount; f++) {
      const y = f * (height / metrics.floorCount);
      list.push(y);
    }
    return list;
  }, [metrics.floorCount, height]);

  // Ground circular compass markings
  const ringGeo = useMemo(() => new THREE.RingGeometry(metrics.groundRadius * 0.98, metrics.groundRadius, 64), [metrics.groundRadius]);
  React.useEffect(() => {
    return () => ringGeo.dispose();
  }, [ringGeo]);

  return (
    <group ref={groupRef} position={[0, -height * 0.45, 0]}>
      {/* Ground Coordinate Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[metrics.groundRadius, 48]} />
        <meshBasicMaterial color={0x08080a} transparent opacity={0.7} />
      </mesh>

      <lineSegments geometry={ringGeo} material={materials.groundRing} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} />

      {/* Ground Grid lines */}
      <gridHelper
        args={[metrics.groundRadius * 2, 20, 0xc5a880, 0x22222a]}
        position={[0, 0.001, 0]}
      />

      {/* Main Architectural Glass Massing */}
      {metrics.typology !== 'land' ? (
        <group position={[0, height / 2, 0]}>
          <mesh geometry={mainBoxGeo} material={materials.glass} />
          <lineSegments geometry={mainEdgesGeo} material={materials.wireframe} />

          {/* Floor Plates */}
          {slabs.map((slabY, idx) => (
            <mesh key={idx} position={[0, slabY - height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[width * 0.99, depth * 0.99]} />
              <meshBasicMaterial color={0x16161e} transparent opacity={0.65} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ) : (
        /* Land Boundary Marker */
        <group position={[0, 0.05, 0]}>
          <mesh geometry={mainBoxGeo} material={materials.glass} />
          <lineSegments geometry={mainEdgesGeo} material={materials.wireframe} />
        </group>
      )}

      {/* Conceptual Spatial Zones */}
      {metrics.zones.map((zone) => {
        const isHovered = activeZoneId === zone.id;
        const [zw, zh, zd] = zone.size;
        return (
          <group
            key={zone.id}
            position={zone.position}
            onPointerOver={(e) => {
              e.stopPropagation();
              onZoneHover?.(zone.id);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              onZoneHover?.(null);
            }}
          >
            <mesh>
              <boxGeometry args={[zw, zh, zd]} />
              <primitive object={isHovered ? materials.activeGlass : materials.glass} attach="material" />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(zw, zh, zd)]} />
              <primitive object={isHovered ? materials.wireframe : materials.zoneWireframe} attach="material" />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
};
