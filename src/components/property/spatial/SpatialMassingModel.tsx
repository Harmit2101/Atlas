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

  // Gentle subtle architectural turntable rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  // Luxury Architectural Materials
  const materials = useMemo(() => {
    return {
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x0e1118,
        transmission: 0.65,
        opacity: 0.42,
        transparent: true,
        roughness: 0.08,
        ior: 1.48,
        metalness: 0.22,
        reflectivity: 0.85,
        depthWrite: false
      }),
      activeGlass: new THREE.MeshPhysicalMaterial({
        color: 0xd4b88f,
        transmission: 0.35,
        opacity: 0.75,
        transparent: true,
        roughness: 0.15,
        emissive: 0xc5a880,
        emissiveIntensity: 0.45,
        depthWrite: false
      }),
      suiteGlass: new THREE.MeshPhysicalMaterial({
        color: 0x3d3120,
        transmission: 0.6,
        opacity: 0.45,
        transparent: true,
        roughness: 0.18,
        depthWrite: false
      }),
      bathGlass: new THREE.MeshPhysicalMaterial({
        color: 0x22384a,
        transmission: 0.6,
        opacity: 0.45,
        transparent: true,
        roughness: 0.2,
        depthWrite: false
      }),
      wireframe: new THREE.LineBasicMaterial({
        color: 0xc5a880,
        transparent: true,
        opacity: 0.85,
        linewidth: 1
      }),
      zoneWireframe: new THREE.LineBasicMaterial({
        color: 0xa89f91,
        transparent: true,
        opacity: 0.55
      }),
      bathWireframe: new THREE.LineBasicMaterial({
        color: 0x6e93ad,
        transparent: true,
        opacity: 0.65
      }),
      podium: new THREE.MeshStandardMaterial({
        color: 0x0a0a0e,
        roughness: 0.7,
        metalness: 0.4
      }),
      podiumBevel: new THREE.LineBasicMaterial({
        color: 0xc5a880,
        transparent: true,
        opacity: 0.35
      }),
      groundRing: new THREE.LineBasicMaterial({
        color: 0xc5a880,
        transparent: true,
        opacity: 0.22
      }),
      compassTick: new THREE.LineBasicMaterial({
        color: 0xe2c295,
        transparent: true,
        opacity: 0.5
      })
    };
  }, []);

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

  // Radial concentric coordinate rings (architectural site boundary)
  const ring1Geo = useMemo(() => new THREE.RingGeometry(metrics.groundRadius * 0.68, metrics.groundRadius * 0.685, 64), [metrics.groundRadius]);
  const ring2Geo = useMemo(() => new THREE.RingGeometry(metrics.groundRadius * 0.985, metrics.groundRadius, 64), [metrics.groundRadius]);

  React.useEffect(() => {
    return () => {
      ring1Geo.dispose();
      ring2Geo.dispose();
    };
  }, [ring1Geo, ring2Geo]);

  return (
    <group ref={groupRef} position={[0, -height * 0.38, 0]}>
      {/* Contact Shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
        <planeGeometry args={[width * 1.5, depth * 1.5]} />
        <meshBasicMaterial color={0x000000} transparent opacity={0.65} depthWrite={false} />
      </mesh>

      {/* Ground Architectural Plinth Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[metrics.groundRadius, 64]} />
        <primitive object={materials.podium} attach="material" />
      </mesh>

      {/* Coordinate rings */}
      <lineSegments geometry={ring1Geo} material={materials.groundRing} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} />
      <lineSegments geometry={ring2Geo} material={materials.podiumBevel} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} />

      {/* Ground Metric Grid */}
      <gridHelper
        args={[metrics.groundRadius * 2, 16, 0xc5a880, 0x1f1f28]}
        position={[0, 0.002, 0]}
      />

      {/* North Cardinal Indicator */}
      <group position={[0, 0.005, -metrics.groundRadius * 0.85]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.2, 0.5, 3]} />
          <meshBasicMaterial color={0xc5a880} />
        </mesh>
      </group>

      {/* Main Volumetric Envelope */}
      {metrics.typology !== 'land' ? (
        <group position={[0, height / 2, 0]}>
          <mesh geometry={mainBoxGeo} material={materials.glass} />
          <lineSegments geometry={mainEdgesGeo} material={materials.wireframe} />

          {/* Floor Plates */}
          {slabs.map((slabY, idx) => (
            <mesh key={idx} position={[0, slabY - height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[width * 0.985, depth * 0.985]} />
              <meshBasicMaterial color={0x12141c} transparent opacity={0.7} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ) : (
        /* Land Boundary Topographic Polygon */
        <group position={[0, 0.06, 0]}>
          <mesh geometry={mainBoxGeo} material={materials.glass} />
          <lineSegments geometry={mainEdgesGeo} material={materials.wireframe} />

          {/* Corner datum beacons */}
          {[
            [-width / 2, 0.35, -depth / 2],
            [width / 2, 0.35, -depth / 2],
            [width / 2, 0.35, depth / 2],
            [-width / 2, 0.35, depth / 2]
          ].map((pos, i) => (
            <group key={i} position={pos as [number, number, number]}>
              <mesh>
                <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
                <meshBasicMaterial color={0xc5a880} />
              </mesh>
              <mesh position={[0, 0.4, 0]}>
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshBasicMaterial color={0xe2c295} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Conceptual Spatial Data Zones */}
      {metrics.zones.map((zone) => {
        const isHovered = activeZoneId === zone.id;
        const [zw, zh, zd] = zone.size;

        const zoneMaterial = isHovered
          ? materials.activeGlass
          : zone.role === 'bath'
          ? materials.bathGlass
          : zone.role === 'primary' || zone.role === 'suite'
          ? materials.suiteGlass
          : materials.glass;

        const edgeMaterial = isHovered
          ? materials.wireframe
          : zone.role === 'bath'
          ? materials.bathWireframe
          : materials.zoneWireframe;

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
              <primitive object={zoneMaterial} attach="material" />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(zw, zh, zd)]} />
              <primitive object={edgeMaterial} attach="material" />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
};
