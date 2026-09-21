import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe2, ArrowRight, Shield, Award, TrendingUp, 
  Search, Filter, ExternalLink, Sparkles, Compass 
} from 'lucide-react';
import { GlobeScene } from '@/components/globe/GlobeScene';
import { UnteraAttribution } from '@/components/ui/UnteraAttribution';
import { useMarkets } from '@/hooks/useMarkets';
import { useProperties } from '@/hooks/useProperties';
import { useCountryBeacons } from '@/hooks/useCountryBeacons';
import { deriveDestinationClusters } from '@/services/destinationService';
import { DestinationCluster } from '@/types/destination';
import { MarketScore } from '@/types/market';

export const MarketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { scores, loading, error, refetch } = useMarkets();
  const { beacons: countryBeacons } = useCountryBeacons();
  const { properties } = useProperties({ pageSize: 24 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<MarketScore | null>(null);
  const [sortOption, setSortOption] = useState<'score' | 'listings' | 'alpha'>('score');

  // Derive dynamic destination clusters for the globe from the live property inventory
  const destinations = useMemo(() => {
    return deriveDestinationClusters(properties);
  }, [properties]);

  // Filtered and sorted scores
  const filteredScores = useMemo(() => {
    return scores
      .filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.countryName.toLowerCase().includes(q) ||
          item.country.toLowerCase().includes(q) ||
          (item.grade && item.grade.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortOption === 'score') return b.score - a.score;
        if (sortOption === 'listings') return (b.listingCount || 0) - (a.listingCount || 0);
        return a.countryName.localeCompare(b.countryName);
      });
  }, [scores, searchQuery, sortOption]);

  const handleCountryClick = (item: MarketScore) => {
    setSelectedCountry(item);
    // Smooth transition into Explore after completing 3D planetary zoom animation
    setTimeout(() => {
      navigate(`/explore?country=${encodeURIComponent(item.country)}&minPrice=300000`);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-[#c5a880]/30 text-[#c5a880] text-[10px] font-mono-luxury uppercase tracking-widest mb-3">
            <Sparkles className="w-3 h-3" />
            <span>GLOBAL PROPERTY INDEX · LIVE MARKET INTELLIGENCE</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-6xl text-[#f4f2ec] tracking-tight">
            Where Should You Buy?
          </h1>
          <p className="text-xs sm:text-sm text-[#8e8d93] mt-2 max-w-2xl font-light leading-relaxed">
            Algorithmic sovereign access indexing across 70+ jurisdictions. Evaluates regulatory foreign ownership, purchasing friction, local tax efficiency, and capital liquidity.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3">
          <UnteraAttribution variant="badge" />
          <span className="text-[11px] font-mono-luxury text-[#8e8d93]">
            {scores.length} Sovereign Jurisdictions Tracked
          </span>
        </div>
      </div>

      {/* Split Layout: 3D Cartography (Left) + Market Index (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Seamless Interactive 3D Globe */}
        <div className="lg:col-span-5 sticky top-24 space-y-2">
          <div className="flex items-center justify-between px-2 pb-1 text-xs font-mono-luxury text-[#8e8d93]">
            <span className="uppercase tracking-widest text-[#c5a880] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>ACTIVE JURISDICTIONS</span>
            </span>
            <span>
              {properties.length} Live Listings · {properties.filter(p => p.latitude && p.longitude).length} Geolocated
            </span>
          </div>

          <div className="w-full h-[460px] sm:h-[520px] relative">
            <GlobeScene
              height="h-full"
              properties={properties}
              countryBeacons={countryBeacons}
              selectedCountryCode={selectedCountry?.country || null}
              onCountrySelect={(beacon) => {
                const found = scores.find(s => s.country.toUpperCase() === beacon.country.toUpperCase());
                if (found) {
                  handleCountryClick(found);
                } else {
                  navigate(`/explore?country=${encodeURIComponent(beacon.country)}&minPrice=300000`);
                }
              }}
              totalListingsCount={properties.length}
              showHUD={false}
            />
          </div>

            {selectedCountry && (
              <div className="mt-4 p-3 rounded bg-[#111116] border border-[#c5a880]/30 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-luxury uppercase text-[#c5a880] block">
                    TRANSITIONING TO
                  </span>
                  <span className="font-editorial text-base text-[#f4f2ec]">
                    {selectedCountry.countryName} ({selectedCountry.country})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono-luxury text-[#c5a880] font-semibold block">
                    Score: {selectedCountry.score}/100
                  </span>
                  <span className="text-[10px] text-[#8e8d93]">Loading MLS inventory...</span>
                </div>
              </div>
            )}
          </div>

        {/* Right Column: Market Score Table & Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Controls Bar: Search & Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded border border-white/10 bg-[#111116]/80 backdrop-blur-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8e8d93] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sovereign markets (e.g. Colombia, Spain, Panama)..."
                className="w-full pl-9 pr-4 py-2 bg-transparent text-xs text-[#f4f2ec] placeholder-[#8e8d93] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono-luxury border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
              <span className="text-[#8e8d93]">SORT:</span>
              <button
                onClick={() => setSortOption('score')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  sortOption === 'score' ? 'bg-[#c5a880] text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'
                }`}
              >
                Score
              </button>
              <button
                onClick={() => setSortOption('listings')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  sortOption === 'listings' ? 'bg-[#c5a880] text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'
                }`}
              >
                Listings
              </button>
              <button
                onClick={() => setSortOption('alpha')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  sortOption === 'alpha' ? 'bg-[#c5a880] text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'
                }`}
              >
                A-Z
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 rounded bg-[#111116] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : error && filteredScores.length === 0 ? (
            <div className="p-8 rounded border border-red-500/20 bg-red-950/10 text-center space-y-3">
              <p className="text-xs font-mono-luxury text-red-400">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-[#c5a880] text-[#08080a] text-xs font-mono-luxury uppercase font-semibold rounded"
              >
                Retry Intelligence Feed
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScores.map((market) => (
                <div
                  key={market.country}
                  onClick={() => handleCountryClick(market)}
                  className="group relative p-5 rounded border border-white/10 hover:border-[#c5a880]/60 bg-[#111116] hover:bg-[#15151c] transition-all duration-300 cursor-pointer shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Country & Specs */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-editorial text-2xl text-[#f4f2ec] group-hover:text-[#c5a880] transition-colors">
                          {market.countryName}
                        </span>
                        <span className="text-[10px] font-mono-luxury uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#8e8d93]">
                          {market.country}
                        </span>
                        {market.grade && (
                          <span className={`text-[10px] font-mono-luxury font-semibold px-2 py-0.5 rounded ${
                            market.grade.startsWith('A') 
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                              : 'bg-[#c5a880]/10 border border-[#c5a880]/30 text-[#c5a880]'
                          }`}>
                            GRADE {market.grade}
                          </span>
                        )}
                      </div>

                      {/* Attribute Pills */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8e8d93]">
                        {market.ownershipAccess && (
                          <span>Access: <strong className="text-[#f4f2ec] font-normal">{market.ownershipAccess}</strong></span>
                        )}
                        {market.affordability && (
                          <span>Affordability: <strong className="text-[#f4f2ec] font-normal">{market.affordability}</strong></span>
                        )}
                        {market.purchaseCosts && (
                          <span>Costs: <strong className="text-[#f4f2ec] font-normal">{market.purchaseCosts}</strong></span>
                        )}
                        {market.listingCount > 0 && (
                          <span className="font-mono-luxury text-[11px] text-[#c5a880]">
                            {market.listingCount.toLocaleString()} Live Listings
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Score Metric & CTA */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                      <div className="flex items-baseline gap-1">
                        <span className="font-editorial text-4xl text-[#c5a880]">
                          {market.score}
                        </span>
                        <span className="text-[11px] font-mono-luxury text-[#8e8d93]">
                          /100
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 text-xs font-mono-luxury uppercase tracking-widest text-[#8e8d93] group-hover:text-[#f4f2ec] transition-colors mt-1">
                        <span>Explore</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legal Disclaimer */}
          <div className="p-4 rounded border border-white/5 bg-[#0a0a0d] text-[11px] text-[#8e8d93] leading-relaxed">
            <p>
              <strong>INFORMATIONAL INTELLIGENCE NOTICE:</strong> Global Property Index metrics are compiled from algorithmic analysis of public land registries, foreign ownership covenants, and comparative tax structures across partner MLS syndicates. ATLAS and Untera provide this index for educational and comparative exploration purposes only. It does not constitute formal legal, tax, or financial advisory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
