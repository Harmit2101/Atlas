import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface UnteraAttributionProps {
  className?: string;
  variant?: 'inline' | 'card' | 'badge';
}

export const UnteraAttribution: React.FC<UnteraAttributionProps> = ({
  className = '',
  variant = 'inline'
}) => {
  if (variant === 'badge') {
    return (
      <a
        href="https://untera.io"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111116] border border-white/10 hover:border-[#c5a880]/50 text-[10px] font-mono-luxury uppercase tracking-wider text-[#8e8d93] hover:text-[#c5a880] transition-colors ${className}`}
      >
        <span>Powered by Untera</span>
        <ArrowUpRight className="w-3 h-3 text-[#c5a880]" />
      </a>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-mono-luxury tracking-widest text-[#8e8d93] uppercase ${className}`}>
      <span>Live property data</span>
      <a
        href="https://untera.io"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#c5a880] hover:text-[#e2c295] underline underline-offset-2 flex items-center gap-0.5 transition-colors"
      >
        <span>Powered by Untera</span>
        <ArrowUpRight className="w-2.5 h-2.5" />
      </a>
    </div>
  );
};
