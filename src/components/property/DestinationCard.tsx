import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Destination } from '@/types/destination';

interface DestinationCardProps {
  destination: Destination;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ destination }) => {
  return (
    <Link
      to={`/explore?destination=${destination.id}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-sm bg-[#111116] border border-white/[0.08] hover:border-[#c5a880]/50 transition-all duration-700"
      data-cursor="EXPLORE"
    >
      {/* Background Image or Editorial Gradient */}
      {destination.image ? (
        <img
          src={destination.image}
          alt={destination.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#181824] via-[#111116] to-[#08080a]" />
      )}
      
      {/* Editorial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/40 to-black/20 group-hover:via-[#08080a]/30 transition-all" />

      {/* Top Meta */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <span className="text-[10px] font-mono-luxury uppercase tracking-widest px-2.5 py-1 rounded bg-[#08080a]/80 backdrop-blur-md border border-white/10 text-[#c5a880]">
          {destination.region || destination.country}
        </span>
        <div className="w-8 h-8 rounded-full bg-[#08080a]/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#f4f2ec] group-hover:text-[#08080a] group-hover:bg-[#c5a880] group-hover:border-[#c5a880] transition-all">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col justify-end">
        <span className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-[#8e8d93]">
          {destination.country}
        </span>
        <h3 className="font-editorial text-2xl text-[#f4f2ec] tracking-wide mt-0.5 group-hover:text-[#c5a880] transition-colors">
          {destination.name}
        </h3>
        <p className="text-xs text-[#8e8d93] mt-1.5 line-clamp-2 font-light leading-relaxed">
          {destination.tagline}
        </p>

        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono-luxury">
          <span className="text-[#8e8d93]">{destination.propertyCount} Active Assets</span>
          <span className="text-[#c5a880]">Avg {destination.averagePrice}</span>
        </div>
      </div>
    </Link>
  );
};
