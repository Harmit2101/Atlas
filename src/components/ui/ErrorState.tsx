import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Atlas data is temporarily unavailable.',
  message = 'Live MLS synchronization encountered a temporary network constraint. Curated archive mode is active.',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`p-6 rounded-sm bg-[#111116] border border-[#c5a880]/30 text-center space-y-4 max-w-lg mx-auto ${className}`}>
      <div className="w-10 h-10 rounded-full bg-[#c5a880]/10 text-[#c5a880] flex items-center justify-center mx-auto">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h4 className="font-editorial text-xl text-[#f4f2ec]">{title}</h4>
        <p className="text-xs text-[#8e8d93] leading-relaxed font-light">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[#c5a880] text-[#08080a] text-xs font-mono-luxury uppercase tracking-wider font-semibold hover:bg-[#e2c295] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};
