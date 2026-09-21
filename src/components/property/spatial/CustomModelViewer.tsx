import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, Grid, Float } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { 
  Upload, Box, Eye, RefreshCw, Sun, Moon, Sparkles, 
  Layers, CheckCircle2, AlertTriangle, FileCode 
} from 'lucide-react';
import { AtlasProperty } from '@/types/property';

interface CustomModelViewerProps {
  property: AtlasProperty;
  height?: string;
  className?: string;
}

// Procedural Architectural Skyscraper & Podium as dynamic fallback / sample BIM model
const ProceduralBIMBuilding: React.FC<{ wireframe: boolean; colorScheme: string }> = ({ wireframe, colorScheme }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Dynamic floor plates and structural frame
  const floorCount = 14;
  const floors = useMemo(() => {
    return Array.from({ length: floorCount }, (_, i) => ({
      y: (i + 1) * 0.4,
      scale: i > 10 ? 1 - (i - 10) * 0.08 : 1.0,
      isAmenity: i === 6 || i === 13
    }));
  }, [floorCount]);

  const glassColor = colorScheme === 'night' ? '#1a365d' : colorScheme === 'sunset' ? '#805ad5' : '#4a5568';
  const emissiveColor = colorScheme === 'night' ? '#c5a880' : '#000000';
  const frameColor = colorScheme === 'night' ? '#2d3748' : '#718096';

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Ground Podium & Plaza */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[4.2, 0.2, 4.2]} />
        <meshStandardMaterial 
          color="#1a1a24" 
          roughness={0.8} 
          metalness={0.2} 
          wireframe={wireframe} 
        />
      </mesh>

      {/* Main Structural Core */}
      <mesh position={[0, (floorCount * 0.4) / 2 + 0.2, 0]}>
        <boxGeometry args={[1.2, floorCount * 0.4, 1.2]} />
        <meshStandardMaterial 
          color="#22222e" 
          roughness={0.9} 
          metalness={0.1} 
          wireframe={wireframe} 
        />
      </mesh>

      {/* Exterior Glass Curtain Wall */}
      <mesh position={[0, (floorCount * 0.4) / 2 + 0.2, 0]}>
        <boxGeometry args={[2.8, floorCount * 0.4, 2.8]} />
        <meshPhysicalMaterial 
          color={glassColor}
          transparent={true}
          opacity={0.35}
          roughness={0.1}
          metalness={0.8}
          reflectivity={0.9}
          wireframe={wireframe}
        />
      </mesh>

      {/* Floorplates & Slabs */}
      {floors.map((fl, i) => (
        <group key={i} position={[0, fl.y, 0]}>
          {/* Concrete Floor Slab */}
          <mesh>
            <boxGeometry args={[2.7 * fl.scale, 0.06, 2.7 * fl.scale]} />
            <meshStandardMaterial 
              color={fl.isAmenity ? '#c5a880' : frameColor}
              roughness={0.6}
              metalness={0.4}
              wireframe={wireframe}
            />
          </mesh>

          {/* Exterior Mullion Accents */}
          {i % 2 === 0 && (
            <mesh position={[0, 0.18, 0]}>
              <boxGeometry args={[2.75 * fl.scale, 0.02, 2.75 * fl.scale]} />
              <meshStandardMaterial 
                color="#c5a880" 
                emissive={emissiveColor}
                emissiveIntensity={0.2}
                wireframe={wireframe} 
              />
            </mesh>
          )}
        </group>
      ))}

      {/* Rooftop Crown / Mechanical Trellis */}
      <mesh position={[0, floorCount * 0.4 + 0.5, 0]}>
        <boxGeometry args={[1.8, 0.4, 1.8]} />
        <meshStandardMaterial 
          color="#c5a880" 
          roughness={0.3} 
          metalness={0.7} 
          wireframe={wireframe} 
        />
      </mesh>
    </group>
  );
};

// GLTF Loaded Scene for custom uploads
const LoadedGLTFModel: React.FC<{ url: string; wireframe: boolean }> = ({ url, wireframe }) => {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        // Traverse and apply wireframe setting if needed
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            if (Array.isArray(m.material)) {
              m.material.forEach((mat) => { (mat as any).wireframe = wireframe; });
            } else if (m.material) {
              (m.material as any).wireframe = wireframe;
            }
          }
        });
        setScene(gltf.scene);
      },
      undefined,
      (err) => {
        console.error('Error loading 3D GLTF model:', err);
        setError('Failed to parse 3D file.');
      }
    );
  }, [url, wireframe]);

  if (error) {
    return null;
  }

  if (!scene) {
    return null;
  }

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
};

export const CustomModelViewer: React.FC<CustomModelViewerProps> = ({
  property,
  height = 'h-[440px] sm:h-[540px]',
  className = ''
}) => {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [modelFileName, setModelFileName] = useState<string | null>(null);
  const [modelFileSize, setModelFileSize] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [lightingPreset, setLightingPreset] = useState<'noon' | 'sunset' | 'night'>('sunset');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<any>(null);

  const handleFileUpload = (file: File) => {
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      alert('Please upload a standard 3D file in .GLB or .GLTF format.');
      return;
    }
    const url = URL.createObjectURL(file);
    setUploadedUrl(url);
    setModelFileName(file.name);
    setModelFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleClearUpload = () => {
    if (uploadedUrl) {
      URL.revokeObjectURL(uploadedUrl);
    }
    setUploadedUrl(null);
    setModelFileName(null);
    setModelFileSize(null);
  };

  return (
    <div 
      className={`relative w-full ${height} bg-[#08080a] border border-white/[0.08] rounded-sm overflow-hidden select-none ${className}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Visual Overlay */}
      {dragActive && (
        <div className="absolute inset-0 z-40 bg-[#08080a]/90 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-[#c5a880] p-6 text-center">
          <Upload className="w-12 h-12 text-[#c5a880] animate-bounce mb-3" />
          <div className="font-editorial text-2xl text-[#f4f2ec]">Drop 3D Architectural Model</div>
          <p className="text-xs text-[#8e8d93] mt-1 font-mono-luxury uppercase">
            Accepts BIM / CAD exports in .GLB or .GLTF format
          </p>
        </div>
      )}

      {/* HUD Header Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Status Pill */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="px-3 py-1.5 rounded bg-[#111116]/90 backdrop-blur-md border border-[#c5a880]/30 text-xs text-[#c5a880] font-mono-luxury flex items-center gap-2 shadow-lg">
            <Box className="w-3.5 h-3.5" />
            <span>{modelFileName ? `Custom BIM: ${modelFileName}` : 'Atlas Verified BIM Massing'}</span>
          </div>
          {modelFileSize && (
            <div className="px-2.5 py-1.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono-luxury text-[#8e8d93]">
              {modelFileSize}
            </div>
          )}
        </div>

        {/* Right Action Tools */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded bg-[#111116]/90 backdrop-blur-md border border-white/10 shadow-lg">
          {/* Lighting toggle */}
          <button
            type="button"
            onClick={() => {
              setLightingPreset(prev => prev === 'noon' ? 'sunset' : prev === 'sunset' ? 'night' : 'noon');
            }}
            title="Switch Solar & Lighting Angle"
            className="p-1.5 rounded text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/5 transition-colors"
          >
            {lightingPreset === 'noon' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : lightingPreset === 'sunset' ? <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
          </button>

          {/* Wireframe toggle */}
          <button
            type="button"
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Structural Wireframe / Facade"
            className={`p-1.5 rounded transition-colors ${wireframe ? 'bg-[#c5a880]/20 text-[#c5a880]' : 'text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/5'}`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Auto rotate toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Orbit Rotation"
            className={`p-1.5 rounded transition-colors ${autoRotate ? 'bg-[#c5a880]/20 text-[#c5a880]' : 'text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/5'}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] text-[10.5px] font-mono-luxury font-semibold uppercase tracking-wider transition-all"
          >
            <Upload className="w-3 h-3" />
            <span>{uploadedUrl ? 'Replace .GLB' : 'Upload .GLB'}</span>
          </button>

          {uploadedUrl && (
            <button
              type="button"
              onClick={handleClearUpload}
              className="px-2 py-1 rounded text-[10px] font-mono-luxury text-[#8e8d93] hover:text-[#f4f2ec] transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [5, 4.5, 6], fov: 42 }}
        className="w-full h-full"
      >
        {/* Environmental Lighting */}
        <ambientLight intensity={lightingPreset === 'noon' ? 0.7 : lightingPreset === 'sunset' ? 0.45 : 0.25} />
        
        <directionalLight 
          position={[10, 15, 10]} 
          intensity={lightingPreset === 'noon' ? 1.4 : lightingPreset === 'sunset' ? 1.0 : 0.4} 
          color={lightingPreset === 'sunset' ? '#fed7aa' : '#ffffff'}
          castShadow 
        />

        {lightingPreset === 'sunset' && (
          <pointLight position={[-8, 6, -8]} intensity={0.6} color="#f6ad55" />
        )}

        {lightingPreset === 'night' && (
          <>
            <pointLight position={[0, 4, 0]} intensity={1.2} color="#c5a880" distance={8} />
            <pointLight position={[3, 1, 3]} intensity={0.8} color="#63b3ed" distance={6} />
          </>
        )}

        {/* 3D Model Rendering */}
        <Suspense fallback={null}>
          {uploadedUrl ? (
            <LoadedGLTFModel url={uploadedUrl} wireframe={wireframe} />
          ) : (
            <Center>
              <ProceduralBIMBuilding wireframe={wireframe} colorScheme={lightingPreset} />
            </Center>
          )}
        </Suspense>

        {/* Spatial Floor Grid */}
        <Grid
          position={[0, -0.3, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#262635"
          sectionSize={2.5}
          sectionThickness={1.2}
          sectionColor="#3f3f5a"
          fadeDistance={18}
          fadeStrength={1.5}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={2.5}
          maxDistance={18}
        />
      </Canvas>

      {/* Bottom Hint Banner */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between text-[10px] font-mono-luxury text-[#8e8d93] pointer-events-none">
        <div className="flex items-center gap-2">
          <span>Click + Drag to rotate</span>
          <span>·</span>
          <span>Scroll to zoom</span>
          <span>·</span>
          <span>Right-click to pan</span>
        </div>
        <div className="hidden sm:block">
          Drop Revit / SketchUp / Rhino .GLB files anywhere on this canvas
        </div>
      </div>
    </div>
  );
};
