import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Shield, Award, Sparkles, TrendingUp, Layers } from 'lucide-react';
import { GlobeScene } from '@/components/globe/GlobeScene';
import { DestinationCard } from '@/components/property/DestinationCard';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertySkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { UnteraAttribution } from '@/components/ui/UnteraAttribution';
import { useProperties } from '@/hooks/useProperties';
import { useDestinations } from '@/hooks/useDestinations';
import { useStats } from '@/hooks/useStats';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Fetch live platform metrics directly from Untera API
  const { stats } = useStats();

  // Fetch live featured listings from Untera
  const { properties, loading, error, isLive, refetch } = useProperties({
    pageSize: 6
  });

  // Dynamically derive destination clusters from live property inventory
  const { destinations, featuredDestinations } = useDestinations(properties);

  const featuredProperties = properties.slice(0, 6);

  const scrollToCollection = () => {
    document.getElementById('exceptional-assets')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-28 md:space-y-40 pb-24">
      {/* ====================================================
          HERO SHOWCASE SECTION (SEAMLESS GLOBE)
          ==================================================== */}
      <section className="relative min-h-[90vh] flex flex-col justify-center pt-8 pb-12 overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-[#c5a880]/[0.03] blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Hero Editorial Typography */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-[#c5a880]/30 text-[#c5a880] text-[10px] font-mono-luxury uppercase tracking-widest">
                <Sparkles className="w-3 h-3" />
                <span>GLOBAL ASSET & REAL ESTATE DISCOVERY</span>
              </div>

              <h1 className="font-editorial text-5xl sm:text-7xl lg:text-8xl tracking-tight text-[#f4f2ec] leading-[0.92]">
                THE WORLD <br />
                <span className="italic font-light text-[#c5a880]">IS YOUR</span> <br />
                MARKET.
              </h1>

              <p className="text-base sm:text-lg text-[#8e8d93] max-w-lg font-light leading-relaxed">
                Discover exceptional properties and generational opportunities across the globe. Powered by unified international cartography and real-time MLS intelligence.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <Link
                  to="/explore"
                  className="px-8 py-4 rounded-sm bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-xl"
                  data-cursor="EXPLORE"
                >
                  <span>EXPLORE THE WORLD</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/markets"
                  className="px-8 py-4 rounded-sm bg-[#111116] hover:bg-white/[0.06] text-[#f4f2ec] border border-white/10 hover:border-[#c5a880]/50 font-mono-luxury text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>MARKET INDEX</span>
                </Link>
              </div>

              {/* Key Global Metrics & Live Attribution */}
              <div className="pt-8 border-t border-white/[0.08] space-y-4">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-2xl font-editorial text-[#f4f2ec]">
                      {stats?.countries || destinations.length || 86}
                    </div>
                    <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93] tracking-widest mt-0.5">
                      Countries Tracked
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-editorial text-[#c5a880]">
                      {stats?.listings ? `${(stats.listings / 1000000).toFixed(1)}M+` : '3.9M+'}
                    </div>
                    <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93] tracking-widest mt-0.5">
                      Live MLS Listings
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-editorial text-[#f4f2ec]">
                      {stats?.sources || 236}
                    </div>
                    <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93] tracking-widest mt-0.5">
                      MLS Syndicates
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <UnteraAttribution variant="inline" />
                </div>
              </div>
            </div>

            {/* 3D Interactive Globe (COMPLETELY SEAMLESS - NO RECTANGLE/BOX) */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div className="w-full relative h-[480px] sm:h-[580px] lg:h-[660px]">
                <GlobeScene 
                  height="h-full" 
                  destinations={destinations}
                  showHUD={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          SECTION 1: FEATURED DESTINATIONS
          ==================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-white/[0.08] pb-6">
          <div>
            <span className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-[#c5a880]">
              DYNAMIC CARTOGRAPHIC HUBS
            </span>
            <h2 className="font-editorial text-4xl sm:text-5xl text-[#f4f2ec] mt-1">
              Active Territories
            </h2>
          </div>
          <p className="text-xs text-[#8e8d93] max-w-sm">
            Dynamically clustered epicenters of architectural significance and sovereign capital allocation.
          </p>
        </div>

        {destinations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDestinations.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded border border-white/10 bg-[#111116] text-center text-xs font-mono-luxury text-[#8e8d93]">
            Cartographic hubs calculating from live listings...
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs font-mono-luxury uppercase tracking-widest text-[#c5a880] hover:text-[#f4f2ec] transition-colors"
          >
            <span>Explore All Active Hubs on the Globe</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ====================================================
          SECTION 2: EXCEPTIONAL ASSETS
          ==================================================== */}
      <section id="exceptional-assets" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-[#c5a880]">
                LIVE MLS DISCOVERY STREAM
              </span>
              <span className="text-[9px] font-mono-luxury uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                LIVE INVENTORY
              </span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl text-[#f4f2ec] mt-1">
              Exceptional Assets
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <UnteraAttribution variant="badge" />
            <Link
              to="/explore"
              className="text-xs font-mono-luxury uppercase tracking-widest text-[#c5a880] hover:text-[#f4f2ec] transition-colors flex items-center gap-1.5"
            >
              <span>Explore Complete Catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Loading or Error State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <PropertySkeleton key={i} />
            ))}
          </div>
        ) : error && properties.length === 0 ? (
          <ErrorState
            title="ATLAS DATA TEMPORARILY UNAVAILABLE"
            message={error}
            onRetry={refetch}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* ====================================================
          SECTION 3: GLOBAL PROPERTY INDEX SPOTLIGHT
          ==================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative p-8 sm:p-12 rounded-sm border border-white/10 bg-[#0e0e13] overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#c5a880]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono-luxury uppercase text-[#c5a880] tracking-widest">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>SOVEREIGN MARKET INTELLIGENCE</span>
            </div>
            <h3 className="font-editorial text-3xl sm:text-4xl text-[#f4f2ec]">
              Where Should You Allocate Sovereign Capital?
            </h3>
            <p className="text-xs sm:text-sm text-[#8e8d93] leading-relaxed font-light">
              Compare global residency pathways, regulatory ownership security, purchase friction, and yield potential across 70+ sovereign jurisdictions through the Atlas Global Property Index.
            </p>
            <div className="pt-2">
              <Link
                to="/markets"
                className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase font-semibold transition-all duration-300"
              >
                <span>Access Market Intelligence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          SECTION 4: THE ATLAS IDEA (EDITORIAL MANIFESTO)
          ==================================================== */}
      <section className="relative bg-[#0c0c10] border-y border-white/[0.08] py-24 sm:py-32 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-10">
          <span className="text-xs font-mono-luxury uppercase tracking-[0.3em] text-[#c5a880]">
            THE ATLAS MANIFESTO
          </span>

          <h2 className="font-editorial text-4xl sm:text-6xl text-[#f4f2ec] leading-tight">
            “One world. <br />
            Thousands of opportunities. <br />
            <span className="italic text-[#c5a880]">One place to explore them.</span>”
          </h2>

          <p className="text-sm sm:text-base text-[#8e8d93] leading-relaxed max-w-2xl mx-auto font-light">
            Real estate at this altitude is generational art, sovereign territory, and architectural history. ATLAS bridges geographical fragmentation into a singular, unified lens of global asset intelligence.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 text-left border-t border-white/[0.08]">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880] mb-3">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-lg text-[#f4f2ec]">Cartographic Discovery</h3>
              <p className="text-xs text-[#8e8d93] leading-relaxed">
                Discover properties by spatial relationship to the Earth—sun orientation, topography, coastlines, and microclimates.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880] mb-3">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-lg text-[#f4f2ec]">Architectural Pedigree</h3>
              <p className="text-xs text-[#8e8d93] leading-relaxed">
                Every asset adheres to stringent standards of design integrity, rare materiality, and historical significance.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880] mb-3">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-lg text-[#f4f2ec]">Sovereign Privacy</h3>
              <p className="text-xs text-[#8e8d93] leading-relaxed">
                Discreet acquisition protocols. Institutional provenance and encrypted dossier delivery.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
