import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Shield, Award, Sparkles, RefreshCw } from 'lucide-react';
import { GlobeScene } from '@/components/globe/GlobeScene';
import { DestinationCard } from '@/components/property/DestinationCard';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertySkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { UnteraAttribution } from '@/components/ui/UnteraAttribution';
import { useProperties } from '@/hooks/useProperties';
import { useDestinations } from '@/hooks/useDestinations';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Fetch live properties from Untera (or high-integrity fallback)
  const { properties, loading, error, isLive, refetch } = useProperties({
    sortBy: 'featured'
  });

  // Dynamically derive destination clusters from properties
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

                <button
                  onClick={scrollToCollection}
                  className="px-8 py-4 rounded-sm bg-[#111116] hover:bg-white/[0.06] text-[#f4f2ec] border border-white/10 hover:border-[#c5a880]/50 font-mono-luxury text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center"
                >
                  VIEW COLLECTION
                </button>
              </div>

              {/* Key Global Metrics & Live Attribution */}
              <div className="pt-8 border-t border-white/[0.08] space-y-4">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-2xl font-editorial text-[#f4f2ec]">
                      {destinations.length}
                    </div>
                    <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93] tracking-widest mt-0.5">
                      Active Hubs
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-editorial text-[#c5a880]">
                      {isLive ? '3.6M+' : '$1.8B+'}
                    </div>
                    <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93] tracking-widest mt-0.5">
                      {isLive ? 'Live MLS Listings' : 'Curated Assets'}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-editorial text-[#f4f2ec]">100%</div>
                    <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93] tracking-widest mt-0.5">
                      Discreet Access
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredDestinations.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs font-mono-luxury uppercase tracking-widest text-[#c5a880] hover:text-[#f4f2ec] transition-colors"
          >
            <span>Explore All {destinations.length} Active Hubs on the Globe</span>
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
                {isLive ? 'LIVE VERIFIED MLS COLLECTION' : 'PRIVATE ARCHIVE COLLECTION'}
              </span>
              <span className="text-[9px] font-mono-luxury uppercase px-2 py-0.5 rounded bg-white/5 text-[#8e8d93]">
                {isLive ? 'LIVE DATA' : 'SAMPLE CURATION'}
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
            title="Atlas live listing stream is temporarily unreachable."
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
          SECTION 3: THE ATLAS IDEA (EDITORIAL MANIFESTO)
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
              <h3 className="font-editorial text-lg text-[#f4f2ec]">Absolute Discretion</h3>
              <p className="text-xs text-[#8e8d93] leading-relaxed">
                Private treaty protocols and off-market representations safeguarding principal privacy at all stages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          SECTION 4: EXPLORE THE WORLD (SEAMLESS GLOBE RETURN)
          ==================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden border border-[#c5a880]/30 bg-[#0c0c10] shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            {/* Left Context */}
            <div className="lg:col-span-5 p-8 sm:p-12 space-y-6 z-10">
              <span className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-[#c5a880]">
                INTERACTIVE ATLAS
              </span>

              <h2 className="font-editorial text-4xl sm:text-5xl text-[#f4f2ec] leading-tight">
                Enter the Global <br />
                <span className="italic text-[#c5a880]">Exploration Suite.</span>
              </h2>

              <p className="text-xs sm:text-sm text-[#8e8d93] leading-relaxed">
                Navigate the planet’s premier asset hubs in full three-dimensional space. Filter by architectural typology, currency valuation, and geographical elevation.
              </p>

              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-mono-luxury uppercase tracking-wider text-[#8e8d93]">
                  Select Direct Entry Point:
                </div>
                <div className="flex flex-wrap gap-2">
                  {destinations.slice(0, 5).map((dest) => (
                    <button
                      key={dest.id}
                      onClick={() => navigate(`/explore?location=${encodeURIComponent(dest.name)}`)}
                      className="text-[11px] font-mono-luxury uppercase px-2.5 py-1 rounded bg-white/5 hover:bg-[#c5a880] hover:text-[#08080a] transition-all text-[#f4f2ec]"
                    >
                      {dest.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-sm bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold transition-all"
                >
                  <span>ENTER ATLAS</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Seamless Globe Panorama */}
            <div className="lg:col-span-7 h-[420px] sm:h-[520px] relative">
              <GlobeScene 
                height="h-full" 
                destinations={destinations}
                showHUD={false} 
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
