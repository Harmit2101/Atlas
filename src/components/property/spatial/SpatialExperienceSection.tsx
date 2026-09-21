import React, { useState } from 'react';
import { AtlasProperty } from '@/types/property';
import { SpatialMassingScene } from './SpatialMassingScene';
import { PhotoImmersionScene } from './PhotoImmersionScene';
import { SpatialFallback2D } from './SpatialFallback2D';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Box, Images, FileText, Compass } from 'lucide-react';
import { isImageUrlBroken, markImageUrlBroken, isSuspectDomain } from '@/services/mediaService';

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

import { determineSpatialCapability, calculateSpatialEnvelope } from './spatialMath';

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

  const capability = React.useMemo(() => {
    return determineSpatialCapability(property);
  }, [property]);

  const metrics = React.useMemo(() => {
    return calculateSpatialEnvelope(property);
  }, [property]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Development Spatial Decision Instrumentation (Phase 9) */}
      {import.meta.env.DEV && (
        <div className="p-2.5 rounded bg-black/60 border border-white/10 font-mono-luxury text-[10px] text-[#8e8d93] flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[#c5a880] font-semibold">SPATIAL DECISION AUDIT:</span>
          <span>LEVEL: <strong className="text-[#f4f2ec]">{capability.level}</strong></span>
          <span>TYPE: <strong className="text-[#f4f2ec]">{property.propertyType || 'UNDEFINED'}</strong></span>
          <span>AREA: <strong className="text-[#f4f2ec]">{property.areaSqm ? `${property.areaSqm}m²` : property.areaSqft ? `${property.areaSqft} sqft` : 'UNDISCLOSED'}</strong></span>
          <span>FLOORS: <strong className="text-[#f4f2ec]">{metrics.floorCount}</strong></span>
          <span>PHOTOS: <strong className="text-[#f4f2ec]">{property.images?.length || 0}</strong></span>
          <span>FLOOR PLANS: <strong className="text-[#f4f2ec]">{property.floorPlans?.length || 0}</strong></span>
          <span>VARIANT: <strong className="text-[#c5a880]">{metrics.floorStackingLabel}</strong></span>
          <span>EVIDENCE: <strong className="text-[#f4f2ec]">{capability.badgeTag}</strong></span>
        </div>
      )}

      {/* Section Header & Mode Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
              <Compass className="w-3.5 h-3.5" />
              <span>Atlas Spatial Intelligence</span>
            </div>
            <span
              className="px-2 py-0.5 rounded text-[9px] font-mono-luxury uppercase tracking-wider font-semibold border"
              style={{
                color: capability.badgeColor,
                borderColor: `${capability.badgeColor}40`,
                backgroundColor: `${capability.badgeColor}10`
              }}
            >
              {capability.badgeLabel}
            </span>
          </div>

          <h2 className="font-editorial text-2xl text-[#f4f2ec]">
            Architectural Volumetric & Spatial Immersion
          </h2>
          <p className="text-xs text-[#8e8d93] max-w-2xl font-light">
            {capability.title} · {capability.disclaimer}
          </p>
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
          <div className="space-y-3">
            <SpatialMassingScene property={property} />

            {/* Corroborating Photographic Evidence Strip (Phase 9: Photography is evidence, Massing is visualization) */}
            {capability.hasPhotographicEvidence && property.images && property.images.length > 0 && (
              <div className="p-3.5 rounded bg-[#111116] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono-luxury uppercase tracking-wider text-[#c5a880]">
                    <Images className="w-3 h-3" />
                    <span>Corroborating Photographic Evidence ({property.images.length} verified photos)</span>
                  </div>
                  <p className="text-[11px] text-[#8e8d93] font-light">
                    Photographic survey serves as factual ground truth. Click to inspect asset in high-resolution immersion.
                  </p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {property.images
                    .filter(imgUrl => Boolean(imgUrl) && !isImageUrlBroken(imgUrl) && !isSuspectDomain(imgUrl))
                    .slice(0, 6)
                    .map((imgUrl, idx) => (
                    <button
                      key={`evidence-thumb-${property.id}-${idx}`}
                      type="button"
                      onClick={() => onSelectImage?.(idx)}
                      title={`View evidence photo ${idx + 1}`}
                      className={`relative w-16 h-11 shrink-0 rounded overflow-hidden border transition-all ${
                        selectedImageIndex === idx
                          ? 'border-[#c5a880] ring-1 ring-[#c5a880] opacity-100 scale-105'
                          : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`Evidence ${idx + 1}`} 
                        loading="lazy" 
                        decoding="async" 
                        onError={() => markImageUrlBroken(imgUrl, imgUrl.includes('homes.jp') ? 'IMAGE_CONNECTION_RESET' : 'IMAGE_UNKNOWN')}
                        className="w-full h-full object-cover" 
                      />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveMode('photo')}
                    className="shrink-0 px-2.5 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono-luxury uppercase tracking-wider text-[#c5a880] transition-colors"
                  >
                    360° Rotunda →
                  </button>
                </div>
              </div>
            )}
          </div>
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
