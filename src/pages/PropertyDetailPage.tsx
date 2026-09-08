import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bookmark, Bed, Bath, Maximize2, Calendar, 
  MapPin, Shield, Check, ExternalLink, Globe2, Loader2
} from 'lucide-react';
import { AtlasProperty } from '@/types/property';
import { fetchPropertyById, fetchProperties } from '@/services/propertyService';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import { PropertyCard } from '@/components/property/PropertyCard';
import { UnteraAttribution } from '@/components/ui/UnteraAttribution';
import { ErrorState } from '@/components/ui/ErrorState';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedProperties();

  const [property, setProperty] = useState<AtlasProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [relatedProperties, setRelatedProperties] = useState<AtlasProperty[]>([]);

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    const controller = new AbortController();

    async function loadProperty() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPropertyById(id!, controller.signal);
        if (mounted) {
          if (data) {
            setProperty(data);
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
  }, [id]);

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

  const saved = isSaved(property.id);

  const handleBookmark = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    toggleSave(property.id, property.sourceName);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySubmitted(true);
  };

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

          {/* Original Source Link */}
          {property.sourceUrl && (
            <a
              href={property.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-luxury uppercase tracking-wider text-[#f4f2ec] transition-colors"
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
          <img
            src={property.images[selectedImageIndex] || property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-black/30" />

          {/* Badges */}
          <div className="absolute top-6 left-6 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest px-3 py-1 rounded bg-[#08080a]/90 backdrop-blur-md border border-white/10 text-[#f4f2ec]">
              {property.status || 'Verified Listing'}
            </span>
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest px-3 py-1 rounded bg-[#c5a880] text-[#08080a] font-semibold">
              {property.propertyType}
            </span>
            {property.isLive && (
              <span className="text-[10px] font-mono-luxury uppercase tracking-widest px-2.5 py-1 rounded bg-black/70 border border-[#c5a880]/50 text-[#c5a880]">
                Untera Verified
              </span>
            )}
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#c5a880] mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{property.city}, {property.country} {property.address ? `· ${property.address}` : ''}</span>
              </div>
              <h1 className="font-editorial text-3xl sm:text-5xl text-[#f4f2ec] tracking-wide max-w-2xl leading-tight">
                {property.title}
              </h1>
            </div>

            <div className="sm:text-right">
              <div className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]">
                Acquisition Valuation
              </div>
              <div className="font-mono-luxury text-3xl sm:text-4xl font-semibold text-[#c5a880]">
                {property.priceFormatted}
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Selector */}
        {property.images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative w-24 sm:w-32 aspect-[16/10] rounded-sm overflow-hidden border transition-all shrink-0 ${
                  selectedImageIndex === idx
                    ? 'border-[#c5a880] ring-2 ring-[#c5a880]/30'
                    : 'border-white/10 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
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
                <div className="font-mono-luxury text-lg text-[#f4f2ec] font-semibold">{property.bedrooms} Suites</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#8e8d93]">
                  <Bath className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>Bathrooms</span>
                </div>
                <div className="font-mono-luxury text-lg text-[#f4f2ec] font-semibold">{property.bathrooms} Baths</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#8e8d93]">
                  <Maximize2 className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>Living Space</span>
                </div>
                <div className="font-mono-luxury text-lg text-[#f4f2ec] font-semibold">{property.areaSqft.toLocaleString()} sq ft</div>
                <div className="text-[10px] text-[#8e8d93]">({property.areaSqm} m²)</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#8e8d93]">
                  <Calendar className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>Completed</span>
                </div>
                <div className="font-mono-luxury text-lg text-[#f4f2ec] font-semibold">{property.yearBuilt || 'Verified'}</div>
              </div>
            </div>

            {/* Editorial Description */}
            <div className="space-y-4">
              <h2 className="font-editorial text-2xl text-[#f4f2ec]">Architectural Narrative</h2>
              <p className="text-sm leading-relaxed text-[#8e8d93] font-light whitespace-pre-line">
                {property.description}
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
            </div>
          </div>

          {/* Right Inquiry Concierge Box */}
          <div className="lg:col-span-4 space-y-6">
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
                  <h4 className="font-editorial text-lg text-[#f4f2ec]">Dossier Request Received</h4>
                  <p className="text-xs text-[#8e8d93]">
                    An Atlas advisor will contact you within 4 hours via encrypted channel.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                      Full Legal Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Lord / Lady / Mr / Ms..."
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                      Confidential Email
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

                  <div>
                    <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                      Telephone / Secure Messaging
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
                      Advisory Requirements
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Questions regarding title, taxation, sovereign residency, or escrow..."
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] focus:border-[#c5a880] outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-sm bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold transition-colors mt-2"
                  >
                    REQUEST CONFIDENTIAL DOSSIER
                  </button>
                </form>
              )}

              <div className="pt-2 text-[10px] font-mono-luxury text-[#8e8d93] text-center">
                HM Coding Private Wealth Protocols · Strict NDA
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Properties */}
      {relatedProperties.length > 0 && (
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
