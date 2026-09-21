import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpatialEnvelopeMetrics, VolumetricBlock } from './spatialMath';

interface SpatialMassingModelProps {
  metrics: SpatialEnvelopeMetrics;
}

interface BlockMeshProps {
  block: VolumetricBlock;
  glassMaterial: THREE.Material;
  wireframeMaterial: THREE.Material;
  slabMaterial: THREE.Material;
  slabEdgeMaterial: THREE.Material;
  isLand?: boolean;
}

const BlockMesh: React.FC<BlockMeshProps> = ({
  block,
  glassMaterial,
  wireframeMaterial,
  slabMaterial,
  slabEdgeMaterial,
  isLand = false
}) => {
  const boxGeo = useMemo(() => new THREE.BoxGeometry(block.width, block.height, block.depth), [block.width, block.height, block.depth]);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo]);

  React.useEffect(() => {
    return () => {
      boxGeo.dispose();
      edgesGeo.dispose();
    };
  }, [boxGeo, edgesGeo]);

  // Generate floor slabs for multi-story articulated blocks
  const floorCount = Math.floor(block.height / 1.15);
  const floorSlabs = useMemo(() => {
    if (isLand || floorCount <= 1) return [];
    const slabs: number[] = [];
    for (let i = 1; i < floorCount; i++) {
      slabs.push(-block.height / 2 + i * (block.height / floorCount));
    }
    return slabs;
  }, [block.height, floorCount, isLand]);

  return (
    <group position={block.position}>
      <mesh geometry={boxGeo} material={glassMaterial} />
      <lineSegments geometry={edgesGeo} material={wireframeMaterial} />

      {/* Internal floor plate slabs */}
      {floorSlabs.map((slabY, idx) => (
        <group key={idx} position={[0, slabY, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[block.width * 0.985, block.depth * 0.985]} />
            <primitive object={slabMaterial} attach="material" />
          </mesh>
          <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
            <edgesGeometry args={[new THREE.PlaneGeometry(block.width * 0.985, block.depth * 0.985)]} />
            <primitive object={slabEdgeMaterial} attach="material" />
          </lineSegments>
        </group>
      ))}
    </group>
  );
};

export const SpatialMassingModel: React.FC<SpatialMassingModelProps> = ({
  metrics
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { width, height, depth } = metrics.dimensions;

  // Gentle architectural turntable rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.04;
    }
  });

  // Luxury Architectural Materials
  const materials = useMemo(() => {
    return {
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x0e1118,
        transmission: 0.68,
        opacity: 0.45,
        transparent: true,
        roughness: 0.08,
        ior: 1.48,
        metalness: 0.2,
        reflectivity: 0.85,
        depthWrite: false
      }),
      accentGlass: new THREE.MeshPhysicalMaterial({
        color: 0x141822,
        transmission: 0.62,
        opacity: 0.52,
        transparent: true,
        roughness: 0.12,
        ior: 1.52,
        metalness: 0.25,
        reflectivity: 0.9,
        depthWrite: false
      }),
      wireframe: new THREE.LineBasicMaterial({
        color: 0xc5a880,
        transparent: true,
        opacity: 0.85,
        linewidth: 1
      }),
      accentWireframe: new THREE.LineBasicMaterial({
        color: 0xe2c295,
        transparent: true,
        opacity: 0.95,
        linewidth: 1
      }),
      slab: new THREE.MeshStandardMaterial({
        color: 0x141620,
        roughness: 0.4,
        metalness: 0.3
      }),
      slabEdge: new THREE.LineBasicMaterial({
        color: 0xc5a880,
        transparent: true,
        opacity: 0.45
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
      })
    };
  }, []);

  React.useEffect(() => {
    return () => {
      Object.values(materials).forEach(m => m.dispose());
    };
  }, [materials]);

  // Fallback geometries if no blocks defined
  const mainBoxGeo = useMemo(() => new THREE.BoxGeometry(width, height, depth), [width, height, depth]);
  const mainEdgesGeo = useMemo(() => new THREE.EdgesGeometry(mainBoxGeo), [mainBoxGeo]);

  React.useEffect(() => {
    return () => {
      mainBoxGeo.dispose();
      mainEdgesGeo.dispose();
    };
  }, [mainBoxGeo, mainEdgesGeo]);

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

      {/* Typological Volumetric Blocks (Property-Specific Massing from Verified Footprint) */}
      {metrics.blocks && metrics.blocks.length > 0 ? (
        metrics.blocks.map((block) => (
          <BlockMesh
            key={block.id}
            block={block}
            glassMaterial={block.isAccent ? materials.accentGlass : materials.glass}
            wireframeMaterial={block.isAccent ? materials.accentWireframe : materials.wireframe}
            slabMaterial={materials.slab}
            slabEdgeMaterial={materials.slabEdge}
            isLand={metrics.typology === 'land'}
          />
        ))
      ) : (
        /* Fallback single volume */
        <group position={[0, height / 2, 0]}>
          <mesh geometry={mainBoxGeo} material={materials.glass} />
          <lineSegments geometry={mainEdgesGeo} material={materials.wireframe} />
        </group>
      )}

      {/* Land Survey Datum Beacons */}
      {metrics.typology === 'land' && (
        <group position={[0, 0.08, 0]}>
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
    </group>
  );
};
