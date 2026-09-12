import React, { useState } from 'react';
import { AtlasProperty } from '@/types/property';
import { SpatialMassingScene } from './SpatialMassingScene';
import { PhotoImmersionScene } from './PhotoImmersionScene';
import { SpatialFallback2D } from './SpatialFallback2D';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Box, Images, FileText, Compass } from 'lucide-react';

interface SpatialExperienceSectionProps {
  property: AtlasProperty;
  selectedImageIndex?: number;
  onSelectImage?: (index: number) => void;
  className?: string;
}

type SpatialMode = 'spatial' | 'photo' | 'blueprint';

class SpatialErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('[ATLAS Spatial 3D] WebGL render fault:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const SpatialExperienceSection: React.FC<SpatialExperienceSectionProps> = ({
  property,
  selectedImageIndex = 0,
  onSelectImage,
  className = ''
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeMode, setActiveMode] = useState<SpatialMode>(
    prefersReducedMotion ? 'blueprint' : 'spatial'
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header & Mode Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            <Compass className="w-3.5 h-3.5" />
            <span>Atlas Spatial Intelligence</span>
          </div>
          <h2 className="font-editorial text-2xl text-[#f4f2ec]">
            Architectural Volumetric & Spatial Immersion
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded bg-[#111116] border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode('spatial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-luxury uppercase tracking-wider transition-all ${
              activeMode === 'spatial'
                ? 'bg-[#c5a880] text-[#08080a] font-semibold shadow-md'
                : 'text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/5'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Spatial View</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('photo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-luxury uppercase tracking-wider transition-all ${
              activeMode === 'photo'
                ? 'bg-[#c5a880] text-[#08080a] font-semibold shadow-md'
                : 'text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/5'
            }`}
          >
            <Images className="w-3.5 h-3.5" />
            <span>Photo Rotunda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('blueprint')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-luxury uppercase tracking-wider transition-all ${
              activeMode === 'blueprint'
                ? 'bg-[#c5a880] text-[#08080a] font-semibold shadow-md'
                : 'text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {/* Active View Display */}
      <SpatialErrorBoundary fallback={<SpatialFallback2D property={property} />}>
        {activeMode === 'spatial' && (
          <SpatialMassingScene property={property} />
        )}

        {activeMode === 'photo' && (
          <PhotoImmersionScene
            images={property.images}
            selectedIndex={selectedImageIndex}
            onSelectImage={onSelectImage}
          />
        )}

        {activeMode === 'blueprint' && (
          <SpatialFallback2D property={property} />
        )}
      </SpatialErrorBoundary>
    </div>
  );
};
