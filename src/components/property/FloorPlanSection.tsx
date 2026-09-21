import React, { useState, useRef } from 'react';
import { AtlasProperty } from '@/types/property';
import { 
  ZoomIn, ZoomOut, RotateCcw, Maximize2, X, ChevronLeft, ChevronRight, 
  FileText, ShieldCheck, Mail
} from 'lucide-react';

interface FloorPlanSectionProps {
  property: AtlasProperty;
  onOpenInquiry?: () => void;
}

export const FloorPlanSection: React.FC<FloorPlanSectionProps> = ({
  property,
  onOpenInquiry
}) => {
  const floorPlans = property.floorPlans || [];
  const hasFloorPlans = floorPlans.length > 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 3.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.7));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : floorPlans.length - 1));
    handleReset();
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < floorPlans.length - 1 ? prev + 1 : 0));
    handleReset();
  };

  return (
    <div className="bg-[#111116] border border-white/[0.08] rounded-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            <FileText className="w-3.5 h-3.5" />
            <span>ARCHITECTURAL SCHEMATICS & BLUEPRINTS</span>
          </div>
          <h3 className="font-editorial text-2xl text-[#f4f2ec] mt-0.5">
            Verified Floor Plan & Layout
          </h3>
        </div>

        {hasFloorPlans && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-luxury text-[#8e8d93]">
              Plan {currentIndex + 1} of {floorPlans.length}
            </span>
            <div className="flex items-center gap-1 bg-[#08080a] border border-white/10 rounded p-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.7}
                className="p-1 rounded text-[#8e8d93] hover:text-[#f4f2ec] disabled:opacity-30 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-1.5 py-0.5 text-[10px] font-mono-luxury text-[#8e8d93] hover:text-[#c5a880] transition-colors"
                title="Reset Zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3.5}
                className="p-1 rounded text-[#8e8d93] hover:text-[#f4f2ec] disabled:opacity-30 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="p-1 rounded text-[#8e8d93] hover:text-[#c5a880] transition-colors border-l border-white/10 ml-1 pl-2"
                title="Open Fullscreen Lightbox"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Floor Plan Display */}
      {hasFloorPlans ? (
        <div className="space-y-4">
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`relative w-full h-[420px] sm:h-[520px] bg-[#08080a] rounded border border-white/[0.06] overflow-hidden flex items-center justify-center ${
              zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
          >
            <img
              src={floorPlans[currentIndex]}
              alt={`Verified Architectural Floor Plan ${currentIndex + 1}`}
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />

            {/* Navigation Arrows for Multi-plan listings */}
            {floorPlans.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#111116]/80 hover:bg-[#c5a880] text-[#f4f2ec] hover:text-[#08080a] border border-white/10 transition-colors"
                  aria-label="Previous Floor Plan"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#111116]/80 hover:bg-[#c5a880] text-[#f4f2ec] hover:text-[#08080a] border border-white/10 transition-colors"
                  aria-label="Next Floor Plan"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Verification Watermark */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#08080a]/90 backdrop-blur-md border border-white/10 text-[10px] font-mono-luxury text-[#c5a880]">
              <ShieldCheck className="w-3 h-3 text-[#c5a880]" />
              <span>Verified Listing Schematic</span>
            </div>
          </div>

          {/* Multi-plan Thumbnails */}
          {floorPlans.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              {floorPlans.map((url, idx) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    handleReset();
                  }}
                  className={`w-24 h-16 rounded overflow-hidden border transition-all shrink-0 bg-[#08080a] ${
                    currentIndex === idx
                      ? 'border-[#c5a880] ring-1 ring-[#c5a880]'
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Honest Luxury Empty State — Zero Fabricated Diagrams */
        <div className="py-14 px-6 text-center space-y-4 bg-[#08080a]/60 border border-white/[0.04] rounded-sm">
          <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center mx-auto text-[#c5a880]">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="font-editorial text-xl text-[#f4f2ec]">
              Floor Plan Not Provided by Source
            </h4>
            <p className="text-xs text-[#8e8d93] leading-relaxed font-light">
              Official architectural blueprints and CAD floorplates were not attached to this MLS record. Authentic surveyed schematics can be requested directly through the listing broker.
            </p>
          </div>
          {onOpenInquiry && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenInquiry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-white/5 hover:bg-[#c5a880]/15 border border-white/10 hover:border-[#c5a880]/40 text-xs font-mono-luxury uppercase tracking-wider text-[#c5a880] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Request Architectural Dossier</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {isLightboxOpen && hasFloorPlans && (
        <div 
          className="fixed inset-0 z-50 bg-[#08080a]/95 backdrop-blur-xl flex flex-col p-4 sm:p-8 animate-in fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <span className="font-editorial text-xl text-[#f4f2ec]">
              {property.title} — Architectural Schematic
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded bg-white/5 hover:bg-white/10 text-[#f4f2ec] transition-colors"
              aria-label="Close Lightbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div 
            className="flex-1 flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={floorPlans[currentIndex]}
              alt={`Full view ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};
