import React from 'react';
import { Html } from '@react-three/drei';
import { Destination } from '@/types/destination';

interface CityLabelProps {
  destination: Destination;
  visible: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

export const CityLabel: React.FC<CityLabelProps> = ({ 
  destination, 
  visible, 
  isSelected = false,
  onClick 
}) => {
  if (!visible) return null;

  return (
    <Html
      position={[0, isSelected ? 0.26 : 0.18, 0]}
      center
      distanceFactor={8}
      zIndexRange={[100, 0]}
      style={{
        pointerEvents: 'auto',
        userSelect: 'none',
        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.95)'
      }}
    >
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`cursor-pointer group flex flex-col items-center bg-[#08080a]/95 backdrop-blur-md border rounded px-3 py-2 shadow-2xl min-w-[130px] text-center transition-all ${
          isSelected 
            ? 'border-[#c5a880] ring-1 ring-[#c5a880]/30 shadow-[#c5a880]/10' 
            : 'border-white/10 hover:border-[#c5a880]/50'
        }`}
      >
        <div className="flex items-center gap-1.5 text-[8px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880] animate-pulse" />
          <span>{isSelected ? 'ACTIVE ASSET LOCATION' : destination.country}</span>
        </div>
        
        <div className="text-xs font-editorial text-[#f4f2ec] tracking-wide mt-0.5 group-hover:text-[#e2c295] transition-colors">
          {destination.name}
        </div>

        {destination.propertyCount > 0 && (
          <div className="mt-1 text-[9px] font-mono-luxury text-[#8e8d93]">
            {destination.propertyCount} {destination.propertyCount === 1 ? 'Live Listing' : 'Live Listings'}
          </div>
        )}

        <div className="mt-1 text-[8px] uppercase tracking-wider text-[#c5a880]/90 group-hover:text-[#f4f2ec] transition-colors">
          {isSelected ? 'View Portfolio →' : 'Explore Location →'}
        </div>
      </div>
    </Html>
  );
};
