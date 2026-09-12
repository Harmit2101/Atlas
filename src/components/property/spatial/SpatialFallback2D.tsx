import React from 'react';
import { AtlasProperty } from '@/types/property';
import { calculateSpatialEnvelope } from './spatialMath';
import { Layers, Bed, Bath, Maximize2, ShieldCheck, Box } from 'lucide-react';

interface SpatialFallback2DProps {
  property: AtlasProperty;
  className?: string;
}

export const SpatialFallback2D: React.FC<SpatialFallback2DProps> = ({
  property,
  className = ''
}) => {
  const metrics = calculateSpatialEnvelope(property);

  return (
    <div className={`p-6 bg-[#111116] border border-white/[0.08] rounded-sm space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            <Box className="w-3.5 h-3.5" />
            <span>2D Architectural Technical Schedule</span>
          </div>
          <h3 className="font-editorial text-xl text-[#f4f2ec]">
            {property.title}
          </h3>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] block">
            Envelope Scale
          </span>
          <span className="font-mono-luxury text-base text-[#c5a880] font-semibold">
            {metrics.sqmLabel}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 rounded bg-white/[0.02] border border-white/[0.05] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#8e8d93]">
            <Layers className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Typology</span>
          </div>
          <div className="font-mono-luxury text-sm text-[#f4f2ec] uppercase font-medium">
            {metrics.typology}
          </div>
        </div>

        <div className="p-3.5 rounded bg-white/[0.02] border border-white/[0.05] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#8e8d93]">
            <Maximize2 className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Dimensions</span>
          </div>
          <div className="font-mono-luxury text-sm text-[#f4f2ec] font-medium">
            {metrics.dimensions.width}m × {metrics.dimensions.depth}m
          </div>
        </div>

        <div className="p-3.5 rounded bg-white/[0.02] border border-white/[0.05] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#8e8d93]">
            <Bed className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Beds</span>
          </div>
          <div className="font-mono-luxury text-sm text-[#f4f2ec] font-medium">
            {property.bedrooms > 0 ? property.bedrooms : 'Not Disclosed'}
          </div>
        </div>

        <div className="p-3.5 rounded bg-white/[0.02] border border-white/[0.05] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#8e8d93]">
            <Bath className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Baths</span>
          </div>
          <div className="font-mono-luxury text-sm text-[#f4f2ec] font-medium">
            {property.bathrooms > 0 ? property.bathrooms : 'Not Disclosed'}
          </div>
        </div>
      </div>

      {/* Conceptual Zone Allocations */}
      <div className="space-y-3">
        <div className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]">
          Conceptual Volume Allocations ({metrics.zones.length} Zones)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {metrics.zones.map((zone) => (
            <div key={zone.id} className="flex items-center justify-between p-3 rounded bg-white/[0.02] border border-white/[0.05]">
              <span className="text-xs text-[#f4f2ec] font-medium">{zone.label}</span>
              <span className="text-[10px] font-mono-luxury text-[#c5a880] uppercase tracking-wider">
                {zone.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 flex items-center gap-2 text-[10px] text-[#8e8d93] border-t border-white/[0.05]">
        <ShieldCheck className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
        <span>Derived strictly from verified Untera MLS data records. No literal layout fabricated.</span>
      </div>
    </div>
  );
};
