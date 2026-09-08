import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Bed, Bath, Maximize2, MapPin } from 'lucide-react';
import { AtlasProperty } from '@/types/property';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import { UnteraAttribution } from '@/components/ui/UnteraAttribution';

interface PropertyCardProps {
  property: AtlasProperty;
  priority?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, priority = false }) => {
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedProperties();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const saved = isSaved(property.id);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    toggleSave(property.id, property.sourceName);
  };

  const handleAuthSuccess = () => {
    toggleSave(property.id, property.sourceName);
  };

  const displayImage = imageError || !property.images[0]
    ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    : property.images[0];

  return (
    <>
      <div className="group relative bg-[#111116] border border-white/[0.08] hover:border-[#c5a880]/40 rounded-sm overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl">
        {/* Media Container */}
        <Link 
          to={`/property/${property.id}`} 
          className="relative aspect-[16/10] overflow-hidden bg-black/40 block"
          data-cursor="VIEW"
        >
          {/* Blur skeleton placeholder while image loads */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />
          )}

          <img
            src={displayImage}
            alt={property.title}
            loading={priority ? 'eager' : 'lazy'}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-transparent to-black/30" />

          {/* Status Pill */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest px-2 py-0.5 rounded bg-[#08080a]/80 backdrop-blur-md border border-white/10 text-[#f4f2ec]">
              {property.status || (property.isLive ? 'Verified MLS' : 'Sample Asset')}
            </span>
            {property.isLive && (
              <span className="text-[9px] font-mono-luxury uppercase px-2 py-0.5 rounded bg-[#c5a880]/20 border border-[#c5a880]/50 text-[#c5a880]">
                Live
              </span>
            )}
          </div>

          {/* Bookmark Action */}
          <button
            onClick={handleBookmarkClick}
            aria-label={saved ? 'Remove from saved' : 'Save property to portfolio'}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all ${
              saved
                ? 'bg-[#c5a880] text-[#08080a] border-[#c5a880]'
                : 'bg-[#08080a]/70 text-[#f4f2ec] border-white/10 hover:border-[#c5a880]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
          </button>

          {/* Asset Type badge */}
          <div className="absolute bottom-3 left-3 text-[10px] font-mono-luxury uppercase tracking-wider text-[#c5a880]">
            {property.propertyType}
          </div>
        </Link>

        {/* Content Container */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Location Line */}
            <div className="flex items-center gap-1.5 text-xs text-[#8e8d93] mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>{property.city}, {property.country}</span>
            </div>

            {/* Title */}
            <Link to={`/property/${property.id}`} className="block group-hover:text-[#c5a880] transition-colors">
              <h3 className="font-editorial text-lg text-[#f4f2ec] leading-snug line-clamp-1">
                {property.title}
              </h3>
            </Link>

            {/* Subtitle / Description */}
            <p className="text-xs text-[#8e8d93] line-clamp-1 mt-1 font-light">
              {property.subtitle || property.description}
            </p>
          </div>

          {/* Specs & Price */}
          <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-[#8e8d93]">
                {property.bedrooms > 0 && (
                  <div className="flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>{property.bedrooms}</span>
                  </div>
                )}
                {property.bathrooms > 0 && (
                  <div className="flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>{property.bathrooms}</span>
                  </div>
                )}
                {property.areaSqft > 0 && (
                  <div className="flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>{property.areaSqft.toLocaleString()} sq ft</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="text-right">
                <span className="font-mono-luxury text-sm font-semibold text-[#f4f2ec] tracking-wide">
                  {property.priceFormatted}
                </span>
              </div>
            </div>

            {/* Untera Attribution line if live */}
            {property.isLive && (
              <div className="pt-1">
                <UnteraAttribution variant="inline" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Prompt Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        propertyTitle={property.title}
      />
    </>
  );
};
