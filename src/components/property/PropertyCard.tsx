import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Bed, Bath, Maximize2, MapPin, ImageOff } from 'lucide-react';
import { AtlasProperty } from '@/types/property';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import { UnteraAttribution } from '@/components/ui/UnteraAttribution';
import { usePropertyImage } from '@/hooks/usePropertyImage';

interface PropertyCardProps {
  property: AtlasProperty;
  priority?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, priority = false }) => {
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedProperties();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Candidate images list preserving source order and fallbacks
  const candidateImages = React.useMemo(() => {
    const list: string[] = [];
    if (property.primaryImage) list.push(property.primaryImage);
    if (property.imageUrl && !list.includes(property.imageUrl)) list.push(property.imageUrl);
    if (property.images && property.images.length > 0) {
      property.images.forEach(img => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [property.primaryImage, property.imageUrl, property.images]);

  const {
    currentUrl,
    imageLoaded,
    hasValidImage,
    imgRef,
    handleLoad,
    handleError
  } = usePropertyImage({
    propertyId: property.id,
    candidateUrls: candidateImages,
    sourceProvider: property.sourceName
  });

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

  return (
    <>
      <div id={`property-${property.id}`} className="group relative bg-[#111116] border border-white/[0.08] hover:border-[#c5a880]/40 rounded-sm overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl">
        {/* Media Container */}
        <Link 
          to={`/property/${property.id}`} 
          className="relative aspect-[16/10] overflow-hidden bg-black/40 block"
          data-cursor="VIEW"
        >
          {hasValidImage && currentUrl ? (
            <>
              {/* Blur skeleton placeholder while image loads */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />
              )}

              <img
                ref={imgRef}
                key={`card-media-${property.id}-${currentUrl}`}
                src={currentUrl}
                alt={property.title}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                referrerPolicy="no-referrer"
                onLoad={handleLoad}
                onError={handleError}
                className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-transparent to-black/30" />
            </>
          ) : (
            /* Tasteful, cinematic IMAGE UNAVAILABLE state — zero fake imagery */
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d13] border border-white/[0.04] p-6 text-center select-none relative overflow-hidden group-hover:border-[#c5a880]/30 transition-colors">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />
              
              <div className="w-11 h-11 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-[#c5a880]/80 mb-2.5 shadow-inner">
                <ImageOff className="w-4 h-4 text-[#c5a880]/70" />
              </div>
              
              <div className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-[#f4f2ec]/90 font-medium">
                Image Unavailable
              </div>
              <div className="text-[8.5px] font-mono-luxury uppercase tracking-widest text-[#c5a880]/70 mt-1">
                Live MLS Listing
              </div>
            </div>
          )}

          {/* Status, Intent, and Tier Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
            {/* Primary Intent Badge */}
            <span
              className={`text-[9.5px] font-mono-luxury uppercase tracking-widest px-2.5 py-0.5 rounded shadow-lg font-semibold ${
                property.listingIntent === 'rent'
                  ? 'bg-[#152033]/90 text-[#8ec5fc] border border-[#3b5b8c]'
                  : 'bg-[#c5a880] text-[#08080a]'
              }`}
            >
              {property.listingIntent === 'rent' ? 'FOR RENT' : 'FOR SALE'}
            </span>

            {/* Commercial Inventory Tier Qualification */}
            {property.isHighValueSale && (
              <span className="text-[8.5px] font-mono-luxury uppercase px-2 py-0.5 rounded bg-[#08080a]/90 border border-[#c5a880]/60 text-[#c5a880] tracking-wider font-medium">
                $300K+ Qualified
              </span>
            )}
            {property.isUltraLuxuryRental && (
              <span className="text-[8.5px] font-mono-luxury uppercase px-2 py-0.5 rounded bg-[#08080a]/90 border border-[#8ec5fc]/60 text-[#8ec5fc] tracking-wider font-medium">
                $5K+/Day Qualified
              </span>
            )}

            {property.isLive && (
              <span className="text-[8.5px] font-mono-luxury uppercase px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[#8e8d93]">
                Live MLS
              </span>
            )}
          </div>

          {/* Bookmark Action */}
          <button
            onClick={handleBookmarkClick}
            aria-label={saved ? 'Remove from saved' : 'Save property to portfolio'}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all z-10 ${
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
              <MapPin className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
              <span className="truncate">{property.displayLocation || (property.city ? `${property.city}, ${property.country}` : property.country)}</span>
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
            <div className="flex items-end justify-between gap-2">
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

              {/* Price with Rental Period */}
              <div className="text-right shrink-0">
                <div className="text-[9px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]">
                  {property.listingIntent === 'rent' ? 'LEASE RATE' : 'VALUATION'}
                </div>
                <div className="font-mono-luxury text-sm sm:text-base font-semibold text-[#f4f2ec] tracking-wide">
                  {property.priceFormatted}
                  {property.listingIntent === 'rent' && property.rentalPeriod && property.rentalPeriod !== 'unknown' && (
                    <span className="text-xs text-[#c5a880] font-normal ml-1">
                      / {property.rentalPeriod.toUpperCase()}
                    </span>
                  )}
                </div>
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
