import React from 'react';
import { Bookmark, Compass, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: 'bookmark' | 'compass';
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'bookmark',
  title = 'Your collection is waiting.',
  description = 'As you navigate the world, save exceptional properties to build your private architectural portfolio.',
  actionText = 'Explore The World',
  actionHref = '/explore',
  onAction,
  className = ''
}) => {
  return (
    <div className={`py-20 px-6 text-center space-y-5 bg-[#111116] border border-white/[0.06] rounded-sm max-w-xl mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#c5a880]">
        {icon === 'compass' ? <Compass className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
      </div>
      <div className="space-y-1.5">
        <h3 className="font-editorial text-2xl sm:text-3xl text-[#f4f2ec]">{title}</h3>
        <p className="text-xs text-[#8e8d93] max-w-sm mx-auto leading-relaxed font-light">
          {description}
        </p>
      </div>

      {actionHref ? (
        <Link
          to={actionHref}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm bg-[#c5a880] text-[#08080a] text-xs font-mono-luxury uppercase tracking-widest font-semibold hover:bg-[#e2c295] transition-colors"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ) : onAction ? (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm bg-[#c5a880] text-[#08080a] text-xs font-mono-luxury uppercase tracking-widest font-semibold hover:bg-[#e2c295] transition-colors"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
};
