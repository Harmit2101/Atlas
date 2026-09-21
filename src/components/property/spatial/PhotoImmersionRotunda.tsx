import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  isImageUrlBroken, 
  markImageUrlBroken, 
  isSuspectDomain, 
  validateCandidateUrlServerSide 
} from '@/services/mediaService';

// Bounded texture cache strictly limited to 6 active textures to prevent GPU memory pressure
const MAX_TEXTURE_CACHE_SIZE = 6;
const textureCache = new Map<string, THREE.Texture>();
const texturePromises = new Map<string, Promise<THREE.Texture | null>>();

function setCachedTexture(url: string, tex: THREE.Texture): void {
  if (textureCache.size >= MAX_TEXTURE_CACHE_SIZE) {
    const oldestKey = textureCache.keys().next().value;
    if (oldestKey) {
      const oldTex = textureCache.get(oldestKey);
      try {
        oldTex?.dispose();
      } catch {}
      textureCache.delete(oldestKey);
    }
  }
  textureCache.set(url, tex);
}

/**
 * Disposes all cached textures and resets promises when rotunda is unmounted
 * or when the user navigates to another property or route.
 */
export function disposePhotoTextureCache(): void {
  for (const [, tex] of textureCache.entries()) {
    try {
      tex.dispose();
    } catch {}
  }
  textureCache.clear();
  texturePromises.clear();
}

export function loadPhotoTexture(url: string): Promise<THREE.Texture | null> {
  if (!url || isImageUrlBroken(url)) {
    return Promise.resolve(null);
  }
  if (textureCache.has(url)) {
    return Promise.resolve(textureCache.get(url)!);
  }
  if (texturePromises.has(url)) {
    return texturePromises.get(url)!;
  }

  const promise = (async () => {
    // If domain is suspect, validate server-side before invoking browser TextureLoader
    if (isSuspectDomain(url)) {
      const validation = await validateCandidateUrlServerSide(url);
      if (!validation.valid) {
        markImageUrlBroken(url, validation.failureType || 'IMAGE_UNKNOWN');
        texturePromises.delete(url);
        return null;
      }
    }

    return new Promise<THREE.Texture | null>((resolve) => {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');

      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = true;
          tex.needsUpdate = true;
          setCachedTexture(url, tex);
          texturePromises.delete(url);
          resolve(tex);
        },
        undefined,
        () => {
          // Fall back gracefully if an individual photographic asset fails or resets connection
          markImageUrlBroken(url, url.includes('homes.jp') ? 'IMAGE_CONNECTION_RESET' : 'IMAGE_UNKNOWN');
          texturePromises.delete(url);
          resolve(null);
        }
      );
    });
  })();

  texturePromises.set(url, promise);
  return promise;
}

interface PhotoPanelProps {
  url: string;
  index: number;
  total: number;
  selectedIndex: number;
  radius: number;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

const PhotoPanel: React.FC<PhotoPanelProps> = ({
  url,
  index,
  total,
  selectedIndex,
  radius,
  onClick,
  onHover
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(() => textureCache.get(url) || null);
  const [hovered, setHovered] = useState(false);

  const isSelected = selectedIndex === index;
  const diff = index - selectedIndex;

  // Staged loading rule (Phase 7): Only request texture for current frame and immediate adjacent frames (diff <= 1)
  const isAdjacentOrSelected = Math.abs(diff) <= 1;

  useEffect(() => {
    let active = true;
    if (isAdjacentOrSelected) {
      if (!texture) {
        loadPhotoTexture(url).then((tex) => {
          if (active && tex) {
            setTexture(tex);
          }
        });
      }
    } else {
      // If panel moves far away, detach local texture reference to encourage VRAM reclamation
      if (texture && !isSelected) {
        setTexture(null);
      }
    }
    return () => {
      active = false;
    };
  }, [url, isAdjacentOrSelected, isSelected, texture]);

  // Position along graceful arc centered directly in front of camera
  const targetTransform = useMemo(() => {
    const step = total > 14 ? 0.34 : 0.38;
    const theta = diff * step;
    const x = radius * Math.sin(theta);
    const z = -radius * (1 - Math.cos(theta)) + (isSelected ? 0.15 : 0);
    const y = isSelected ? 0.08 : 0;
    const rotY = -theta * 0.9;
    const scale = isSelected ? 1.15 : Math.max(0.72, 1.0 - Math.abs(diff) * 0.08);

    return {
      pos: [x, y, z] as [number, number, number],
      rotY,
      scale,
      visible: Math.abs(diff) <= 6
    };
  }, [diff, radius, isSelected, total]);

  // Smooth position, scale, and rotation interpolation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetTransform.pos[0], 0.12);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetTransform.pos[1], 0.12);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetTransform.pos[2], 0.12);

      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetTransform.rotY, 0.12);

      const targetScale = isSelected ? 1.15 : hovered ? targetTransform.scale * 1.05 : targetTransform.scale;
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.12));
    }
  });

  if (!targetTransform.visible) return null;

  const panelWidth = 2.6;
  const panelHeight = 1.625; // 16:10 architectural photograph ratio

  return (
    <group
      ref={meshRef}
      position={targetTransform.pos}
      rotation={[0, targetTransform.rotY, 0]}
      scale={targetTransform.scale}
    >
      {/* Interactive Photo Mesh */}
      <mesh
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
          <meshBasicMaterial
            key={texture.uuid}
            map={texture}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshBasicMaterial color={0x13131a} side={THREE.DoubleSide} />
        )}
      </mesh>

      {/* Luxury Gold Bezel & Rim */}
      <lineSegments position={[0, 0, 0.002]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(panelWidth, panelHeight)]} />
        <lineBasicMaterial
          color={isSelected ? 0xc5a880 : hovered ? 0xe2c295 : 0x3e3e48}
          linewidth={isSelected ? 2 : 1}
        />
      </lineSegments>

      {/* Frame number badge beneath each panel */}
      {isSelected && (
        <group position={[0, -panelHeight * 0.58, 0.01]}>
          <mesh>
            <planeGeometry args={[0.9, 0.22]} />
            <meshBasicMaterial color={0x0a0a0e} transparent opacity={0.85} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(0.9, 0.22)]} />
            <lineBasicMaterial color={0xc5a880} />
          </lineSegments>
        </group>
      )}
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

  // Clean disposal on unmount to completely free GPU VRAM
  useEffect(() => {
    return () => {
      disposePhotoTextureCache();
    };
  }, []);

  // Pre-fetch ONLY active image and immediately adjacent frames (Phase 7)
  useEffect(() => {
    if (!images || images.length === 0) return;
    const windowIndices = [
      selectedIndex,
      (selectedIndex + 1) % images.length,
      (selectedIndex - 1 + images.length) % images.length
    ];

    windowIndices.forEach((idx) => {
      const url = images[idx];
      if (url && !isImageUrlBroken(url)) {
        loadPhotoTexture(url);
      }
    });
  }, [selectedIndex, images]);

  const radius = 4.8;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Ground architectural plinth disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25, 0]}>
        <circleGeometry args={[radius * 1.35, 64]} />
        <meshBasicMaterial color={0x060609} />
      </mesh>

      {/* Refined radial grid */}
      <gridHelper
        args={[radius * 2.7, 20, 0xc5a880, 0x181822]}
        position={[0, -1.24, 0]}
      />

      {/* Genuine listing photograph panels */}
      {images.map((url, idx) => (
        <PhotoPanel
          key={url + idx}
          url={url}
          index={idx}
          total={images.length}
          selectedIndex={selectedIndex}
          radius={radius}
          onClick={() => onSelectImage(idx)}
          onHover={setAnyHovered}
        />
      ))}
    </group>
  );
};
