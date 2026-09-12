import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PhotoImmersionRotunda } from './PhotoImmersionRotunda';
import { Images, ChevronLeft, ChevronRight, RotateCcw, ImageOff, Sparkles } from 'lucide-react';

interface PhotoImmersionSceneProps {
  images: string[];
  selectedIndex?: number;
  onSelectImage?: (index: number) => void;
  className?: string;
  height?: string;
}

export const PhotoImmersionScene: React.FC<PhotoImmersionSceneProps> = ({
  images,
  selectedIndex: externalSelectedIndex = 0,
  onSelectImage,
  className = '',
  height = 'h-[360px] sm:h-[480px] lg:h-[520px]'
}) => {
  const [internalIndex, setInternalIndex] = useState(externalSelectedIndex);
  const [controlsKey, setControlsKey] = useState(0);

  useEffect(() => {
    setInternalIndex(externalSelectedIndex);
  }, [externalSelectedIndex]);

  const handleSelect = (idx: number) => {
    setInternalIndex(idx);
    onSelectImage?.(idx);
  };

  const handlePrev = () => {
    if (images.length === 0) return;
    const nextIdx = (internalIndex - 1 + images.length) % images.length;
    handleSelect(nextIdx);
  };

  const handleNext = () => {
    if (images.length === 0) return;
    const nextIdx = (internalIndex + 1) % images.length;
    handleSelect(nextIdx);
  };

  // Keyboard arrow listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [internalIndex, images.length]);

  if (!images || images.length === 0) {
    return (
      <div className={`relative w-full ${height} bg-[#08080a] border border-white/[0.08] rounded-sm flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-[#c5a880]/80 mb-3 shadow-inner">
          <ImageOff className="w-6 h-6 text-[#c5a880]/70" />
        </div>
        <div className="text-xs font-mono-luxury uppercase tracking-[0.3em] text-[#f4f2ec]/90 font-medium">
          No Spatial Photography Available
        </div>
        <div className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]/70 mt-1">
          Listing syndicate provided 0 photographic assets
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${height} bg-[#08080a] border border-white/[0.08] rounded-sm overflow-hidden select-none ${className}`}>
      {/* Top HUD: Provenance & Image Count */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-xs text-[#f4f2ec]">
            <Images className="w-3.5 h-3.5 text-[#c5a880]" />
            <span className="font-mono-luxury uppercase tracking-wider text-[11px]">
              3D Photo Rotunda
            </span>
          </div>

          <div className="px-2.5 py-1 rounded bg-[#111116]/90 backdrop-blur-md border border-white/10 text-xs text-[#c5a880] font-mono-luxury text-[11px]">
            Frame {internalIndex + 1} of {images.length}
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous photograph"
            className="p-1.5 rounded bg-[#111116]/90 hover:bg-white/10 border border-white/10 text-[#f4f2ec] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photograph"
            className="p-1.5 rounded bg-[#111116]/90 hover:bg-white/10 border border-white/10 text-[#f4f2ec] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setControlsKey(k => k + 1)}
            aria-label="Reset perspective"
            title="Reset perspective"
            className="p-1.5 rounded bg-[#111116]/90 hover:bg-white/10 border border-white/10 text-[#8e8d93] hover:text-[#f4f2ec] transition-colors ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* R3F Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 4.3], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x08080a, 1);
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[0, 6, 8]} intensity={1.2} color="#ffffff" />
        <pointLight position={[0, 0, 1]} intensity={0.6} color="#c5a880" />

        <OrbitControls
          key={controlsKey}
          enableDamping
          dampingFactor={0.06}
          target={[0, 0, 0]}
          minDistance={2.2}
          maxDistance={7.5}
          maxPolarAngle={Math.PI / 1.92}
          minPolarAngle={Math.PI / 2.15}
          rotateSpeed={0.55}
        />

        <PhotoImmersionRotunda
          images={images}
          selectedIndex={internalIndex}
          onSelectImage={handleSelect}
        />
      </Canvas>

      {/* Bottom HUD: Disclaimer & Navigation Hints */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pointer-events-none">
        <div className="text-[10px] text-[#8e8d93] font-light">
          Real property photography mapped onto spatial rotunda. Left Drag to Rotate · Click panel to focus.
        </div>

        <div className="flex items-center gap-2 text-[9px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]/80 self-end sm:self-auto">
          <Sparkles className="w-3 h-3 text-[#c5a880]/60" />
          <span>Arrows ← → Navigate</span>
        </div>
      </div>
    </div>
  );
};
