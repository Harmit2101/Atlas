import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PhotoPanelProps {
  url: string;
  index: number;
  total: number;
  isSelected: boolean;
  radius: number;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

const PhotoPanel: React.FC<PhotoPanelProps> = ({
  url,
  index,
  total,
  isSelected,
  radius,
  onClick,
  onHover
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [hovered, setHovered] = useState(false);

  // Position along cylindrical arc
  // Spread images over an arc from -90 deg to +90 deg (or full circle if > 14 images)
  const angle = useMemo(() => {
    if (total <= 1) return 0;
    const maxArc = total > 10 ? Math.PI * 1.5 : Math.PI * 0.9;
    const step = maxArc / Math.max(total - 1, 1);
    return -maxArc / 2 + index * step;
  }, [index, total]);

  const targetPosition = useMemo(() => {
    const r = isSelected ? radius - 0.45 : radius;
    const x = Math.sin(angle) * r;
    const z = -Math.cos(angle) * r + (radius - 2.5);
    const y = isSelected ? 0.15 : 0;
    return [x, y, z] as [number, number, number];
  }, [angle, radius, isSelected]);

  // Load and cache texture with cleanup
  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
      url,
      (tex) => {
        if (!active) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.generateMipmaps = true;
        setTexture(tex);
      },
      undefined,
      () => {
        // Suppress failed texture loads gracefully
      }
    );

    return () => {
      active = false;
      if (texture) texture.dispose();
    };
  }, [url]);

  // Smooth position and scale interpolation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetPosition[0], 0.1);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetPosition[1], 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetPosition[2], 0.1);

      const targetScale = isSelected ? 1.08 : hovered ? 1.03 : 1.0;
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1));

      // Face toward center
      meshRef.current.rotation.y = angle;
    }
  });

  const panelWidth = 2.4;
  const panelHeight = 1.5;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={targetPosition}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHover(false);
        }}
      >
        <planeGeometry args={[panelWidth, panelHeight]} />
        {texture ? (
          <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
        ) : (
          <meshBasicMaterial color={0x111116} side={THREE.DoubleSide} />
        )}

        {/* Framing Bezel */}
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(panelWidth, panelHeight)]} />
          <lineBasicMaterial
            color={isSelected ? 0xc5a880 : hovered ? 0xe2c295 : 0x444450}
            linewidth={isSelected ? 2 : 1}
          />
        </lineSegments>
      </mesh>
    </group>
  );
};

interface PhotoImmersionRotundaProps {
  images: string[];
  selectedIndex: number;
  onSelectImage: (index: number) => void;
}

export const PhotoImmersionRotunda: React.FC<PhotoImmersionRotundaProps> = ({
  images,
  selectedIndex,
  onSelectImage
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [, setAnyHovered] = useState(false);

  const radius = Math.min(Math.max(images.length * 0.45 + 3.5, 4.2), 7.5);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Ground subtle architectural circular grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <circleGeometry args={[radius * 1.3, 64]} />
        <meshBasicMaterial color={0x060608} />
      </mesh>

      <gridHelper
        args={[radius * 2.6, 24, 0xc5a880, 0x1a1a22]}
        position={[0, -1.19, 0]}
      />

      {/* Render each genuine listing photo along the 3D arc */}
      {images.map((url, idx) => (
        <PhotoPanel
          key={url + idx}
          url={url}
          index={idx}
          total={images.length}
          isSelected={selectedIndex === idx}
          radius={radius}
          onClick={() => onSelectImage(idx)}
          onHover={setAnyHovered}
        />
      ))}
    </group>
  );
};
