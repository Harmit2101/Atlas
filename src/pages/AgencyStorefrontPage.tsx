import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchDealerBySlug, fetchDealerProperties, convertDealerPropertyToAtlas } from '@/services/dealerService';
import { DealerOrganization, DealerProperty } from '@/types/commercial';
import { AtlasProperty } from '@/types/property';
import { PropertyCard } from '@/components/property/PropertyCard';
import { 
  Building2, MapPin, Globe, Mail, Phone, ShieldCheck, 
  ArrowLeft, CheckCircle2, Lock
} from 'lucide-react';

export const AgencyStorefrontPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [dealer, setDealer] = useState<DealerOrganization | null>(null);
  const [properties, setProperties] = useState<DealerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [whiteLabel, setWhiteLabel] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    async function loadAgency() {
      setLoading(true);
      const org = await fetchDealerBySlug(slug!);
      if (org) {
        setDealer(org);
        const props = await fetchDealerProperties(org.id);
        setProperties(props);

        // Load white-label overrides
        const savedWl = localStorage.getItem(`atlas_whitelabel_config_${org.id}`) || 
                        localStorage.getItem('atlas_whitelabel_config_default');
        if (savedWl) {
          try {
            setWhiteLabel(JSON.parse(savedWl));
          } catch {}
        }
      }
      setLoading(false);
    }
    loadAgency();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-mono-luxury text-xs text-[#8e8d93]">
        Verifying Agency Credentials & Curated Inventory...
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="max-w-xl mx-auto my-24 p-8 bg-[#111116] border border-white/10 rounded text-center space-y-4">
        <Building2 className="w-10 h-10 text-[#8e8d93] mx-auto" />
        <h2 className="font-editorial text-2xl text-[#f4f2ec]">Agency Record Not Found</h2>
        <p className="text-xs text-[#8e8d93]">
          The requested agency profile is not currently registered or verified in the Atlas Partner Network.
        </p>
        <Link to="/explore" className="inline-block mt-4 text-xs font-mono-luxury uppercase text-[#c5a880] hover:underline">
          ← Return to Global Discovery
        </Link>
      </div>
    );
  }

  // Convert direct dealer properties into AtlasProperty cards for display
  const atlasProps: AtlasProperty[] = properties.map(p => convertDealerPropertyToAtlas(p, dealer.name));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-xs font-mono-luxury uppercase tracking-widest text-[#8e8d93] hover:text-[#f4f2ec]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Global Discovery</span>
        </Link>
      </div>

      {/* Agency Hero Header */}
      <div className="bg-[#111116] border border-white/10 rounded-sm p-8 sm:p-12 relative overflow-hidden">
        {/* White-label watermark if configured */}
        {whiteLabel?.disclaimerWatermark && (
          <div className="mb-4 inline-block px-3 py-1 rounded bg-black/40 border border-white/10 text-[9px] font-mono-luxury tracking-widest text-[#8e8d93]">
            {whiteLabel.disclaimerWatermark}
          </div>
        )}

        <div className="max-w-3xl space-y-6">
          <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            <ShieldCheck className="w-4 h-4 text-[#c5a880]" />
            <span>
              {whiteLabel?.removeAtlasBranding ? 'Authorized Commercial Desk' : 'Atlas Verified Partner Agency'} · {dealer.country}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {whiteLabel?.logoUrl && (
              <img 
                src={whiteLabel.logoUrl} 
                alt={whiteLabel.agencyName || dealer.name} 
                className="w-12 h-12 rounded object-cover border border-white/20 shadow-md" 
              />
            )}
            <h1 className="font-editorial text-4xl sm:text-5xl text-[#f4f2ec]">
              {whiteLabel?.agencyName || dealer.name}
            </h1>
          </div>

          {dealer.description ? (
            <p className="text-sm text-[#8e8d93] leading-relaxed font-light">
              {dealer.description}
            </p>
          ) : (
            <p className="text-sm text-[#8e8d93] leading-relaxed font-light">
              Official partner brokerage managing exclusive residential mandates, trophy architectural properties, and private acquisition portfolios in {dealer.city}, {dealer.country}.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono-luxury text-[#8e8d93]">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>{dealer.city}, {dealer.country}</span>
            </div>
            {dealer.website && (
              <a 
                href={dealer.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 hover:text-[#f4f2ec] transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-[#c5a880]" />
                <span>Official Portal</span>
              </a>
            )}
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>{dealer.contact_email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curated Exclusive Inventory */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
              DIRECT MANDATES
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#f4f2ec]">
              Verified Agency Portfolio ({properties.length})
            </h2>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="p-12 text-center rounded bg-[#111116] border border-white/5 space-y-3">
            <Lock className="w-8 h-8 text-[#8e8d93] mx-auto opacity-50" />
            <h4 className="font-editorial text-lg text-[#f4f2ec]">No Public Mandates Listed</h4>
            <p className="text-xs text-[#8e8d93] max-w-md mx-auto">
              This agency's current mandates are held under confidential private treaty or pending direct inventory ingestion. Inquire with Atlas Concierge for private access.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {atlasProps.map(prop => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
