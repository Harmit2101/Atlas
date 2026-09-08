import React from 'react';

export const PropertySkeleton: React.FC = () => {
  return (
    <div className="bg-[#111116] border border-white/[0.06] rounded-sm overflow-hidden flex flex-col animate-pulse">
      {/* Media Skeleton */}
      <div className="aspect-[16/10] bg-white/[0.03] relative">
        <div className="absolute top-3 left-3 w-16 h-4 bg-white/5 rounded" />
        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5" />
      </div>

      {/* Content Skeleton */}
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="w-24 h-3 bg-white/5 rounded" />
          <div className="w-3/4 h-5 bg-white/5 rounded" />
          <div className="w-1/2 h-3 bg-white/5 rounded" />
        </div>

        <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
          <div className="flex gap-3">
            <div className="w-8 h-3 bg-white/5 rounded" />
            <div className="w-8 h-3 bg-white/5 rounded" />
            <div className="w-12 h-3 bg-white/5 rounded" />
          </div>
          <div className="w-20 h-4 bg-[#c5a880]/10 rounded" />
        </div>
      </div>
    </div>
  );
};

export const GlobeLoader: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
      <div className="w-16 h-16 rounded-full border border-[#c5a880]/20 border-t-[#c5a880] animate-spin" />
      <span className="mt-4 text-[10px] font-mono-luxury tracking-[0.25em] uppercase text-[#c5a880]">
        INITIALIZING CARTOGRAPHY
      </span>
    </div>
  );
};
