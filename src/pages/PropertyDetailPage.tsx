import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bookmark, Bed, Bath, Maximize2, Calendar, 
  MapPin, Shield, Check, ExternalLink, Globe2, Loader2, ImageOff,
  Briefcase, Send, Sparkles, AlertCircle, X, Maximize
} from 'lucide-react';
import { AtlasProperty } from '@/types/property';
import { fetchPropertyById, fetchProperties } from '@/services/propertyService';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import { PropertyCard } from '@/components/property/PropertyCard';
import { UnteraAttribution } from '@/components/ui/UnteraAttribution';
import { ErrorState } from '@/components/ui/ErrorState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SpatialExperienceSection } from '@/components/property/spatial/SpatialExperienceSection';
import { FloorPlanSection } from '@/components/property/FloorPlanSection';
import { ProFormaCalculator } from '@/components/property/financials/ProFormaCalculator';
import { OfferingMemorandumSection } from '@/components/property/dealroom/OfferingMemorandumSection';
import { submitInquiry, submitListingClaim, recordEngagement } from '@/services/commercialService';
import { BuyerType, PurchasePurpose, PurchaseTimeline, FinancingStatus } from '@/types/commercial';
import { usePropertyImage } from '@/hooks/usePropertyImage';

import { 
  isImageUrlBroken, 
  markImageUrlBroken, 
  isSuspectDomain, 
  validateCandidateUrlServerSide 
} from '@/services/mediaService';

interface ThumbnailButtonProps {
  src: string;
  index: number;
  isSelected: boolean;
  shouldLoad: boolean;
  onClick: () => void;
}

const ThumbnailButton: React.FC<ThumbnailButtonProps> = ({
  src,
  index,
  isSelected,
  shouldLoad,
  onClick
}) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isValidated, setIsValidated] = useState(!isSuspectDomain(src));
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [inView, setInView] = useState(shouldLoad);

  useEffect(() => {
    if (shouldLoad) {
      setInView(true);
      return;
    }
    const el = btnRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad]);

  // Phase 8: Suspect candidate URLs are validated before rendering <img>
  useEffect(() => {
    if (!inView) return;
    if (!isSuspectDomain(src)) {
      setIsValidated(true);
      return;
    }
    if (isImageUrlBroken(src)) {
      setHasError(true);
      return;
    }

    let cancelled = false;
    validateCandidateUrlServerSide(src).then(res => {
      if (cancelled) return;
      if (res.valid) {
        setIsValidated(true);
      } else {
        setHasError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [inView, src]);

  // If a specific thumbnail fails to load or is known broken, never render an empty black box
  if (hasError || isImageUrlBroken(src)) return null;

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      aria-label={`Inspect photo ${index + 1}`}
      className={`relative w-24 sm:w-32 aspect-[16/10] rounded-sm overflow-hidden border transition-all shrink-0 bg-[#0d0d13] ${
        isSelected
          ? 'border-[#c5a880] ring-2 ring-[#c5a880]/50 scale-[1.02]'
          : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
      }`}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />
      )}
      {inView && isValidated && (
        <img
          src={src}
          alt={`Listing view ${index + 1}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setHasError(true);
            markImageUrlBroken(src, src.includes('homes.jp') ? 'IMAGE_CONNECTION_RESET' : 'IMAGE_UNKNOWN');
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/75 text-[9px] font-mono-luxury text-[#f4f2ec]/80 leading-none">
        {index + 1}
      </div>
    </button>
  );
};

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedProperties();

  const [property, setProperty] = useState<AtlasProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [omModalOpen, setOmModalOpen] = useState(false);
  
  // Phase 1 Commercial State
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    message: '',
    budgetMin: '',
    budgetMax: '',
    purchaseTimeline: '1_to_3_months' as PurchaseTimeline,
    buyerType: 'individual' as BuyerType,
    purpose: 'second_home' as PurchasePurpose,
    financingStatus: 'cash' as FinancingStatus
  });

  // Phase 2 Claim Listing Modal State
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimForm, setClaimForm] = useState({
    name: '',
    email: '',
    brokerageName: '',
    licenseNumber: '',
    notes: ''
  });

  const [relatedProperties, setRelatedProperties] = useState<AtlasProperty[]>([]);

  // Candidate images list preserving source order and fallbacks
  const candidateImages = useMemo(() => {
    if (!property) return [];
    const list: string[] = [];
    if (property.primaryImage) list.push(property.primaryImage);
    if (property.imageUrl && !list.includes(property.imageUrl)) list.push(property.imageUrl);
    if (property.images && property.images.length > 0) {
      property.images.forEach(img => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [property?.primaryImage, property?.imageUrl, property?.images]);

  // Shared reliable media hook for detail hero & candidate switching
  const {
    currentUrl: activeHeroUrl,
    imageLoaded: heroImageLoaded,
    imageError: heroImageError,
    imgRef: heroImgRef,
    handleLoad: handleHeroImageLoad,
    handleError: handleHeroImageError,
    candidateIndex: selectedImageIndex,
    selectCandidate: handleSelectThumbnail
  } = usePropertyImage({
    propertyId: property?.id || '',
    candidateUrls: candidateImages
  });

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    const controller = new AbortController();

    // Reset state immediately on route/id change to prevent stale images/data
    setProperty(null);
    setInquirySubmitted(false);
    setInquiryError(null);
    setClaimSubmitted(false);
    setRelatedProperties([]);
    setLoading(true);
    setError(null);

    async function loadProperty() {
      try {
        const data = await fetchPropertyById(id!, controller.signal);
        if (mounted) {
          if (data) {
            setProperty(data);
            recordEngagement(data.id, 'property_view', { source: data.sourceName });

            // Auto-fill user email if authenticated
            if (user) {
              setInquiryForm(prev => ({
                ...prev,
                name: user.displayName || prev.name,
                email: user.email || prev.email
              }));
              setClaimForm(prev => ({
                ...prev,
                name: user.displayName || prev.name,
                email: user.email || prev.email
              }));
            }

            // Fetch related properties in same country/city
            fetchProperties({ country: data.country }, controller.signal)
              .then(res => {
                if (mounted) {
                  setRelatedProperties(res.properties.filter(p => p.id !== data.id).slice(0, 3));
                }
              })
              .catch(() => {});
          } else {
            setError('The requested asset record was not found in the global registry.');
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && mounted) {
          setError(err.message || 'Failed to retrieve asset details.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProperty();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [id, user]);

  const saved = property ? isSaved(property.id) : false;

  const handleBookmark = () => {
    if (!property) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    toggleSave(property.id, property.sourceName);
    recordEngagement(property.id, 'property_saved', {}, user.id);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setInquirySubmitting(true);
    setInquiryError(null);

    const res = await submitInquiry({
      propertyId: property.id,
      propertySource: property.sourceName?.toLowerCase().includes('untera') ? 'untera' : 'direct_dealer',
      propertySourceUrl: property.sourceUrl,
      propertyTitle: property.title,
      userId: user?.id,
      fullName: inquiryForm.name,
      email: inquiryForm.email,
      phone: inquiryForm.phone,
      whatsapp: inquiryForm.whatsapp,
      message: inquiryForm.message,
      budgetMin: inquiryForm.budgetMin ? Number(inquiryForm.budgetMin) : undefined,
      budgetMax: inquiryForm.budgetMax ? Number(inquiryForm.budgetMax) : undefined,
      currency: property.currency || 'USD',
      purchaseTimeline: inquiryForm.purchaseTimeline,
      buyerType: inquiryForm.buyerType,
      purpose: inquiryForm.purpose,
      financingStatus: inquiryForm.financingStatus,
      source: 'property_detail_concierge'
    });

    setInquirySubmitting(false);
    if (res.data) {
      setInquirySubmitted(true);
      recordEngagement(property.id, 'inquiry_submitted', { inquiry_id: res.data.id }, user?.id);
    } else {
      setInquiryError(res.error || 'Failed to submit inquiry.');
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setClaimSubmitting(true);
    const res = await submitListingClaim({
      propertyId: property.id,
      claimantUserId: user.id,
      claimantName: claimForm.name,
      claimantEmail: claimForm.email,
      brokerageName: claimForm.brokerageName,
      licenseNumber: claimForm.licenseNumber,
      notes: claimForm.notes
    });
    setClaimSubmitting(false);
    if (res.success) {
      setClaimSubmitted(true);
    }
  };

  // Safe early returns - no hooks are called below these lines!
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#c5a880] animate-spin" />
        <span className="text-xs font-mono-luxury uppercase tracking-widest text-[#8e8d93]">
          Retrieving Dossier & Provenance Records...
        </span>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24">
        <ErrorState
          title="Asset Unavailable"
          message={error || 'Unable to retrieve property record.'}
          onRetry={() => window.location.reload()}
        />
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/explore')}
            className="text-xs font-mono-luxury uppercase text-[#c5a880] hover:underline"
          >
            ← Return to Global Discovery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-12">
      {/* Top Breadcrumb Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-mono-luxury uppercase tracking-widest text-[#8e8d93] hover:text-[#f4f2ec] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discovery</span>
        </button>

        <div className="flex items-center gap-3">
          {property.isLive && <UnteraAttribution variant="badge" />}

          {/* Presentation Mode Button (Phase 2B) */}
          <button
            onClick={() => navigate(`/property/${property.id}/present`)}
            title="Open iPad / Client Presentation Mode"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#c5a880]/10 hover:bg-[#c5a880]/20 border border-[#c5a880]/40 text-xs font-mono-luxury uppercase tracking-wider text-[#c5a880] transition-colors"
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>PRESENTATION MODE</span>
          </button>

          {/* Original Source Link */}
          {property.sourceUrl && (
            <a
              href={property.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-luxury uppercase tracking-wider text-[#f4f2ec] transition-colors"
            >
              <span>VIEW ORIGINAL LISTING</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#c5a880]" />
            </a>
          )}

          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm border text-xs font-mono-luxury uppercase tracking-wider transition-all ${
              saved
                ? 'bg-[#c5a880] text-[#08080a] border-[#c5a880] font-semibold'
                : 'bg-[#111116] text-[#f4f2ec] border-white/10 hover:border-[#c5a880]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
            <span>{saved ? 'Saved in Portfolio' : 'Bookmark Asset'}</span>
          </button>
        </div>
      </div>

      {/* Cinematic Gallery Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-sm overflow-hidden bg-black/50 border border-white/[0.08]">
          {activeHeroUrl && !heroImageError ? (
            <>
              {!heroImageLoaded && (
                <div className="absolute inset-0 bg-white/[0.04] animate-pulse" />
              )}
              <img
                ref={heroImgRef}
                key={`detail-hero-${property.id}-${selectedImageIndex}-${activeHeroUrl}`}
                src={activeHeroUrl}
                alt={property.title}
                loading="eager"
                decoding="async"
                onLoad={handleHeroImageLoad}
                onError={handleHeroImageError}
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  heroImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d13] p-8 text-center select-none relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]" />
              <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-[#c5a880]/80 mb-3 shadow-inner">
                <ImageOff className="w-6 h-6 text-[#c5a880]/70" />
              </div>
              <div className="text-xs font-mono-luxury uppercase tracking-[0.3em] text-[#f4f2ec]/90 font-medium">
                Image Unavailable
              </div>
              <div className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]/70 mt-1">
                Live MLS Listing
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-black/30 pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-6 left-6 flex items-center gap-2 flex-wrap pointer-events-none">
            <span
              className={`text-[10px] font-mono-luxury uppercase tracking-widest px-3 py-1 rounded shadow-lg font-semibold ${
                property.listingIntent === 'rent'
                  ? 'bg-[#152033]/90 text-[#8ec5fc] border border-[#3b5b8c]'
                  : 'bg-[#c5a880] text-[#08080a]'
              }`}
            >
              {property.listingIntent === 'rent' ? 'FOR RENT' : 'FOR SALE'}
            </span>
            {property.isHighValueSale && (
              <span className="text-[10px] font-mono-luxury uppercase tracking-widest px-3 py-1 rounded bg-[#08080a]/90 backdrop-blur-md border border-[#c5a880]/60 text-[#c5a880]">
                $300,000+ Qualified Asset
              </span>
            )}
            {property.isUltraLuxuryRental && (
              <span className="text-[10px] font-mono-luxury uppercase tracking-widest px-3 py-1 rounded bg-[#08080a]/90 backdrop-blur-md border border-[#8ec5fc]/60 text-[#8ec5fc]">
                $5,000+/Day Qualified Lease
              </span>
            )}
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest px-3 py-1 rounded bg-[#08080a]/90 backdrop-blur-md border border-white/10 text-[#f4f2ec]">
              {property.propertyType}
            </span>
            {property.isLive && (
              <span className="text-[10px] font-mono-luxury uppercase tracking-widest px-2.5 py-1 rounded bg-black/70 border border-[#c5a880]/50 text-[#c5a880]">
                Untera Verified
              </span>
            )}
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-none">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#c5a880] mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{property.displayLocation || `${property.city}, ${property.country}`}</span>
              </div>
              <h1 className="font-editorial text-3xl sm:text-5xl text-[#f4f2ec] tracking-wide max-w-2xl leading-tight">
                {property.title}
              </h1>
            </div>

            <div className="sm:text-right">
              <div className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]">
                {property.listingIntent === 'rent' ? 'Rental Lease Rate' : 'Acquisition Valuation'}
              </div>
              <div className="font-mono-luxury text-3xl sm:text-4xl font-semibold text-[#c5a880]">
                {property.priceFormatted}
                {property.listingIntent === 'rent' && property.rentalPeriod && property.rentalPeriod !== 'unknown' && (
                  <span className="text-sm font-normal text-[#f4f2ec] ml-1.5">
                    / {property.rentalPeriod.toUpperCase()}
                  </span>
                )}
                {property.listingIntent === 'rent' && (!property.rentalPeriod || property.rentalPeriod === 'unknown') && (
                  <span className="text-xs font-normal text-[#8e8d93] ml-1.5 block sm:inline">
                    (Rental period not disclosed)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Gallery Strip: strictly rendered from candidate images with staged progressive loading */}
        {candidateImages.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]">
              <span>Gallery Archives ({selectedImageIndex + 1} of {candidateImages.length})</span>
              <span>Click thumbnail to view</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {candidateImages.map((img, idx) => (
                <ThumbnailButton
                  key={img}
                  src={img}
                  index={idx}
                  isSelected={selectedImageIndex === idx}
                  shouldLoad={idx < 4 || selectedImageIndex === idx}
                  onClick={() => handleSelectThumbnail(idx)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3D Spatial Intelligence & Architectural Schematics Experience */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <ErrorBoundary componentName="3D Spatial Intelligence">
          <SpatialExperienceSection
            property={property}
            selectedImageIndex={selectedImageIndex}
            onSelectImage={handleSelectThumbnail}
          />
        </ErrorBoundary>

        {/* Dedicated Verified Architectural Floor Plan Section (Phase 7) */}
        <ErrorBoundary componentName="Floor Plan Registry">
          <FloorPlanSection
            property={property}
            onOpenInquiry={() => {
              document.getElementById('inquiry-dossier')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </ErrorBoundary>
      </div>


      {/* Main Content & Specs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Narrative & Details */}
          <div className="lg:col-span-8 space-y-10">
            {/* Specs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-sm bg-[#111116] border border-white/[0.08]">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#8e8d93]">
                  <Bed className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>Bedrooms</span>
                </div>
                <div className="font-mono-luxury text-lg text-[#f4f2ec] font-semibold">
                  {property.bedrooms > 0 ? `${property.bedrooms} ${property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}` : 'Not Disclosed'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#8e8d93]">
                  <Bath className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>Bathrooms</span>
                </div>
                <div className="font-mono-luxury text-lg text-[#f4f2ec] font-semibold">
                  {property.bathrooms > 0 ? `${property.bathrooms} ${property.bathrooms === 1 ? 'Bath' : 'Baths'}` : 'Not Disclosed'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#8e8d93]">
                  <Maximize2 className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>Living Space</span>
                </div>
                <div className="font-mono-luxury text-lg text-[#f4f2ec] font-semibold">
                  {property.areaSqft > 0 ? `${property.areaSqft.toLocaleString()} sq ft` : 'Not Disclosed'}
                </div>
                {property.areaSqm > 0 && (
                  <div className="text-[10px] text-[#8e8d93]">({property.areaSqm} m²)</div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#8e8d93]">
                  <Calendar className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>Completed</span>
                </div>
                <div className="font-mono-luxury text-lg text-[#f4f2ec] font-semibold">
                  {property.yearBuilt || 'Not Disclosed'}
                </div>
              </div>
            </div>

            {/* Editorial Description */}
            <div className="space-y-4">
              <h2 className="font-editorial text-2xl text-[#f4f2ec]">Architectural Narrative</h2>
              <p className="text-sm leading-relaxed text-[#8e8d93] font-light whitespace-pre-line">
                {property.description || 'Listing description not provided by MLS source. Full asset documentation and specifications available upon inquiry.'}
              </p>
            </div>

            {/* Source & Provenance Attribution Banner */}
            <div className="p-6 rounded-sm bg-[#c5a880]/5 border-l-2 border-[#c5a880] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Provenance & Source Registry</span>
                </div>
                {property.isLive && <UnteraAttribution variant="badge" />}
              </div>
              <p className="text-xs text-[#f4f2ec] font-light leading-relaxed">
                Source Provider: <span className="font-medium text-[#c5a880]">{property.sourceName}</span> (ID: {property.sourceId}).
              </p>
              {property.sourceUrl && (
                <div className="pt-1">
                  <a
                    href={property.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#c5a880] hover:text-[#e2c295] underline underline-offset-4"
                  >
                    <span>VIEW ORIGINAL LISTING AT SOURCE</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Key Features List */}
            <div className="space-y-4">
              <h2 className="font-editorial text-2xl text-[#f4f2ec]">Asset Specifications & Highlights</h2>
              {property.features.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded bg-white/[0.02] border border-white/[0.05]">
                      <div className="w-5 h-5 rounded-full bg-[#c5a880]/10 flex items-center justify-center text-[#c5a880] shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs text-[#f4f2ec]">{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded bg-white/[0.02] border border-white/[0.05] text-xs text-[#8e8d93] font-light">
                  Detailed amenity and specification schedules are available directly from the registry source upon verified inquiry.
                </div>
              )}
            </div>

            {/* Institutional Pro-Forma Underwriting Engine */}
            <ErrorBoundary componentName="Pro-Forma Underwriting">
              <ProFormaCalculator
                property={property}
                onUnlockOM={() => setOmModalOpen(true)}
              />
            </ErrorBoundary>

            {/* Digital Offering Memorandum & Virtual Deal Room */}
            <ErrorBoundary componentName="Offering Memorandum Deal Room">
              <OfferingMemorandumSection
                property={property}
                isOpenModalRequested={omModalOpen}
                onCloseModalRequest={() => setOmModalOpen(false)}
              />
            </ErrorBoundary>
          </div>

          {/* Right Inquiry Concierge Box */}
          <div className="lg:col-span-4 space-y-6">
            <ErrorBoundary componentName="Inquiry Concierge">
              <div className="bg-[#111116] border border-[#c5a880]/30 p-6 rounded-sm space-y-5 shadow-2xl sticky top-28">
                <div className="space-y-1 border-b border-white/[0.08] pb-4">
                  <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
                    DISCREET INQUIRY
                  </span>
                  <h3 className="font-editorial text-2xl text-[#f4f2ec]">Private Treaty Concierge</h3>
                  <p className="text-xs text-[#8e8d93]">
                    Request an unbranded investment dossier or arrange a confidential viewing.
                  </p>
                </div>

                {inquirySubmitted ? (
                  <div className="py-8 text-center space-y-3 bg-white/[0.02] border border-[#c5a880]/40 rounded p-4">
                    <div className="w-8 h-8 rounded-full bg-[#c5a880] text-[#08080a] flex items-center justify-center mx-auto">
                      <Check className="w-4 h-4" />
                    </div>
                    <h4 className="font-editorial text-lg text-[#f4f2ec]">Acquisition Request Received</h4>
                    <p className="text-xs text-[#8e8d93]">
                      Your inquiry has been logged in the private concierge registry. Our team will review your mandate and coordinate with the listing representative.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-3.5 text-xs">
                    {inquiryError && (
                      <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{inquiryError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                        Full Legal Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Principal / Representative Name"
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                        className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                        Confidential Email *
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="principal@familyoffice.com"
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                          Telephone
                        </label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={inquiryForm.phone}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                          className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                          WhatsApp
                        </label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={inquiryForm.whatsapp}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, whatsapp: e.target.value })}
                          className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                        />
                      </div>
                    </div>

                    {/* Qualification Fields */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                          Buyer Entity
                        </label>
                        <select
                          value={inquiryForm.buyerType}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, buyerType: e.target.value as BuyerType })}
                          className="w-full bg-[#08080a] border border-white/10 rounded px-2.5 py-2 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                        >
                          <option value="individual">Individual Buyer</option>
                          <option value="family_office">Family Office</option>
                          <option value="advisor_representative">Broker / Advisor</option>
                          <option value="corporate_investor">Institutional Investor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                          Timeline
                        </label>
                        <select
                          value={inquiryForm.purchaseTimeline}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, purchaseTimeline: e.target.value as PurchaseTimeline })}
                          className="w-full bg-[#08080a] border border-white/10 rounded px-2.5 py-2 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                        >
                          <option value="immediate">Immediate (&lt; 30 days)</option>
                          <option value="1_to_3_months">1 to 3 Months</option>
                          <option value="3_to_6_months">3 to 6 Months</option>
                          <option value="exploratory">Exploratory / Market Study</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                          Purpose
                        </label>
                        <select
                          value={inquiryForm.purpose}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, purpose: e.target.value as PurchasePurpose })}
                          className="w-full bg-[#08080a] border border-white/10 rounded px-2.5 py-2 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                        >
                          <option value="second_home">Secondary Estate</option>
                          <option value="primary_residence">Primary Residence</option>
                          <option value="investment">Capital Preservation / Yield</option>
                          <option value="development">Architectural Development</option>
                          <option value="other">Special Mandate</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                          Capital Status
                        </label>
                        <select
                          value={inquiryForm.financingStatus}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, financingStatus: e.target.value as FinancingStatus })}
                          className="w-full bg-[#08080a] border border-white/10 rounded px-2.5 py-2 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                        >
                          <option value="cash">100% Unencumbered Cash</option>
                          <option value="financing">Private Banking / Structured Debt</option>
                          <option value="undecided">Undisclosed / Flexible</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                        Advisory Requirements / Questions
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Specify requested documentation (e.g. cadastral plan, title deed, private viewing schedule)..."
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                        className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] focus:border-[#c5a880] outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={inquirySubmitting}
                      className="w-full py-3 rounded-sm bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold transition-colors mt-2 flex items-center justify-center gap-2"
                    >
                      {inquirySubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Transmitting Mandate...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>REQUEST PRIVATE ACCESS</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                <div className="pt-2 border-t border-white/[0.06] text-center space-y-2">
                  <div className="text-[10px] font-mono-luxury text-[#8e8d93]">
                    Atlas Concierge Protocol · Strict Non-Disclosure
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setClaimModalOpen(true)}
                      className="text-[10px] font-mono-luxury uppercase tracking-wider text-[#c5a880]/80 hover:text-[#c5a880] transition-colors"
                    >
                      Are you the listing representative? Claim listing →
                    </button>
                  </div>
                </div>
              </div>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Claim Listing Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111116] border border-white/10 w-full max-w-md rounded p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
                  BROKER VERIFICATION
                </span>
                <h3 className="font-editorial text-xl text-[#f4f2ec]">Claim Property Representation</h3>
              </div>
              <button 
                onClick={() => setClaimModalOpen(false)}
                className="text-[#8e8d93] hover:text-[#f4f2ec] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {claimSubmitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#c5a880] text-[#08080a] flex items-center justify-center mx-auto">
                  <Check className="w-4 h-4" />
                </div>
                <h4 className="font-editorial text-lg text-[#f4f2ec]">Claim Submitted for Audit</h4>
                <p className="text-xs text-[#8e8d93]">
                  Our administration will verify your mandate with the regional regulatory body or listing portal before granting direct lead access.
                </p>
                <button
                  onClick={() => { setClaimModalOpen(false); setClaimSubmitted(false); }}
                  className="mt-4 px-4 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-mono-luxury text-[#f4f2ec]"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-3 text-xs">
                <p className="text-[11px] text-[#8e8d93]">
                  If your agency holds an exclusive or co-exclusive representation mandate for this asset, claim it to receive verified buyer leads directly.
                </p>

                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Representative Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={claimForm.name}
                    onChange={e => setClaimForm({ ...claimForm, name: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-1.5 text-[#f4f2ec] outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Corporate / Agency Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={claimForm.email}
                    onChange={e => setClaimForm({ ...claimForm, email: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-1.5 text-[#f4f2ec] outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Brokerage / Agency Firm *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Knight Frank, Sotheby's International Realty"
                    value={claimForm.brokerageName}
                    onChange={e => setClaimForm({ ...claimForm, brokerageName: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-1.5 text-[#f4f2ec] outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    License / Mandate Reference
                  </label>
                  <input
                    type="text"
                    placeholder="RERA / MLS / State License Number"
                    value={claimForm.licenseNumber}
                    onChange={e => setClaimForm({ ...claimForm, licenseNumber: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-1.5 text-[#f4f2ec] outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Mandate Verification Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Link to official firm listing or mandate details..."
                    value={claimForm.notes}
                    onChange={e => setClaimForm({ ...claimForm, notes: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-1.5 text-[#f4f2ec] outline-none focus:border-[#c5a880] resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(false)}
                    className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs font-mono-luxury text-[#8e8d93]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimSubmitting}
                    className="px-4 py-1.5 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] text-xs font-mono-luxury font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    {claimSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Submit Claim</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Related Properties */}
      {relatedProperties.length > 0 && (
        <ErrorBoundary componentName="Complementary Opportunities">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-white/[0.08] space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
                  SIMILAR ACQUISITIONS
                </span>
                <h2 className="font-editorial text-3xl text-[#f4f2ec]">Complementary Opportunities</h2>
              </div>
              <button 
                onClick={() => navigate('/explore')} 
                className="text-xs font-mono-luxury uppercase tracking-wider text-[#c5a880] hover:underline"
              >
                View All Properties →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedProperties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* Auth Modal for Unauthenticated Saves */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => toggleSave(property.id, property.sourceName)}
        propertyTitle={property.title}
      />
    </div>
  );
};
