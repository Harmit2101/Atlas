import React from 'react';
import { Html } from '@react-three/drei';
import { Destination } from '@/types/destination';

interface CityLabelProps {
  destination: Destination;
  visible: boolean;
  onClick: () => void;
}

export const CityLabel: React.FC<CityLabelProps> = ({ destination, visible, onClick }) => {
  if (!visible) return null;

  return (
    <Html
      position={[0, 0.18, 0]}
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
        className="cursor-pointer group flex flex-col items-center bg-[#0c0c10]/95 backdrop-blur-md border border-[#c5a880]/40 rounded px-3.5 py-2 shadow-2xl min-w-[140px] text-center hover:border-[#c5a880] transition-colors"
      >
        <div className="text-[9px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
          {destination.country}
        </div>
        <div className="text-xs font-medium text-[#f4f2ec] tracking-wide mt-0.5 group-hover:text-[#e2c295] transition-colors">
          {destination.name}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#8e8d93]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880] animate-pulse" />
          <span>{destination.propertyCount} Exclusive Assets</span>
        </div>
        <div className="mt-1.5 text-[8px] uppercase tracking-wider text-[#c5a880]/80 group-hover:text-[#f4f2ec] transition-colors">
          Click to Discover →
        </div>
      </div>
    </Html>
  );
};
