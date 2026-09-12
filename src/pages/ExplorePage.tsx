import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlobeScene } from '@/components/globe/GlobeScene';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyFilterBar } from '@/components/property/PropertyFilterBar';
import { PropertySkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { UnteraAttribution } from '@/components/ui/UnteraAttribution';
import { useProperties } from '@/hooks/useProperties';
import { isValidCoordinate } from '@/services/destinationService';
import { PropertyFilterState, AtlasProperty } from '@/types/property';
import { ArrowDown, Loader2, Compass } from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filter from URL params
  const [filter, setFilter] = useState<PropertyFilterState>(() => {
    return {
      country: searchParams.get('country') || '',
      location: searchParams.get('location') || searchParams.get('destination') || searchParams.get('q') || '',
      propertyType: searchParams.get('type') || '',
      transactionType: searchParams.get('transaction') || '',
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      bedrooms: searchParams.get('bedrooms') || '',
      searchQuery: searchParams.get('q') || '',
      sortBy: searchParams.get('sort') || 'featured',
      page: 1,
      pageSize: 24
    };
  });

  const [activeTab, setActiveTab] = useState<'both' | 'globe' | 'grid'>('both');

  // Query live properties from Untera API with pagination support
  const { 
    properties, 
    loading, 
    loadingMore, 
    error, 
    total, 
    hasMore, 
    loadMore, 
    isLive, 
    refetch 
  } = useProperties(filter);

  // Derive live geocoded cartography metrics directly from properties (zero clusters)
  const { geocodedCount, uniqueLocationsCount } = useMemo(() => {
    const geocoded = properties.filter(p => isValidCoordinate(p.latitude, p.longitude));
    const uniqueCoords = new Set(
      geocoded.map(p => `${Number(p.latitude).toFixed(4)}_${Number(p.longitude).toFixed(4)}`)
    );
    return {
      geocodedCount: geocoded.length,
      uniqueLocationsCount: uniqueCoords.size
    };
  }, [properties]);

  // Sync URL params when searchParams change (browser back/forward navigation)
  useEffect(() => {
    const country = searchParams.get('country') || '';
    const loc = searchParams.get('location') || searchParams.get('destination') || searchParams.get('q') || '';
    const type = searchParams.get('type') || '';
    const transaction = searchParams.get('transaction') || '';
    const sort = searchParams.get('sort') || 'featured';
    const beds = searchParams.get('bedrooms') || '';

    setFilter(prev => ({
      ...prev,
      country,
      location: loc,
      propertyType: type,
      transactionType: transaction,
      sortBy: sort,
      bedrooms: beds,
      searchQuery: searchParams.get('q') || loc
    }));
  }, [searchParams]);

  // Handle filter changes and update URL params cleanly
  const handleFilterChange = (newFilter: PropertyFilterState) => {
    setFilter(newFilter);
    const params: Record<string, string> = {};
    if (newFilter.country) params.country = newFilter.country;
    if (newFilter.location) params.location = newFilter.location;
    if (newFilter.propertyType) params.type = newFilter.propertyType;
    if (newFilter.transactionType) params.transaction = newFilter.transactionType;
    if (newFilter.bedrooms) params.bedrooms = newFilter.bedrooms;
    if (newFilter.minPrice) params.minPrice = String(newFilter.minPrice);
    if (newFilter.maxPrice) params.maxPrice = String(newFilter.maxPrice);
    if (newFilter.sortBy && newFilter.sortBy !== 'featured') params.sort = newFilter.sortBy;
    if (newFilter.searchQuery && !newFilter.location) params.q = newFilter.searchQuery;

    setSearchParams(params);
  };

  const handleReset = () => {
    const cleared: PropertyFilterState = {
      country: '',
      location: '',
      destinationId: '',
      propertyType: '',
      transactionType: '',
      minPrice: undefined,
      maxPrice: undefined,
      bedrooms: '',
      searchQuery: '',
      sortBy: 'featured',
      page: 1,
      pageSize: 24
    };
    setFilter(cleared);
    setSearchParams({});
  };

  const activeHubName = filter.country 
    ? `Country: ${filter.country}` 
    : filter.location 
      ? `Territory: ${filter.location}` 
      : 'Global Exploration';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-[#c5a880]">
            GLOBAL DISCOVERY ENGINE
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#f4f2ec] mt-1">
            {activeHubName}
          </h1>
          <p className="text-xs text-[#8e8d93] mt-1 max-w-xl">
            {isLive
              ? `Streaming live real estate listings from the Untera global MLS across 80+ international territories.`
              : `Explore exceptional real-estate opportunities worldwide.`}
          </p>
        </div>

        {/* View Mode & Attribution */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <UnteraAttribution variant="badge" />

          <div className="flex items-center gap-1 p-1 rounded bg-[#111116] border border-white/10 text-xs font-mono-luxury">
            <button
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'both' ? 'bg-[#c5a880] text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveTab('globe')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'globe' ? 'bg-[#c5a880] text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'
              }`}
            >
              3D Globe
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'grid' ? 'bg-[#c5a880] text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'
              }`}
            >
              Asset Grid
            </button>
          </div>
        </div>
      </div>

      {/* 3D Globe Section (Seamlessly floating planetary view) */}
      {(activeTab === 'both' || activeTab === 'globe') && (
        <div className="relative w-full space-y-2 py-2">
          <div className="flex items-center justify-between px-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]">
            <span className="flex items-center gap-1.5 text-[#c5a880]">
              <Compass className="w-3.5 h-3.5" />
              <span>LIVE CARTOGRAPHY · INTERACTIVE PLANETARY ATLAS</span>
            </span>
            <span>
              {loading ? (
                'Streaming live coordinates...'
              ) : properties.length === 0 ? (
                '0 Live Listings'
              ) : (
                `${properties.length} LIVE ${properties.length === 1 ? 'LISTING' : 'LISTINGS'} · ${geocodedCount} GEOLOCATED (${uniqueLocationsCount} DISTINCT LOCATIONS)`
              )}
            </span>
          </div>

          <div className="relative w-full bg-transparent overflow-visible">
            <GlobeScene
              height={activeTab === 'globe' ? 'h-[600px] sm:h-[700px]' : 'h-[360px] sm:h-[440px]'}
              properties={properties}
              totalListingsCount={properties.length}
              showHUD={false}
            />
          </div>
        </div>
      )}

      {/* Live Filter Bar */}
      <PropertyFilterBar
        filter={filter}
        onChange={handleFilterChange}
        onReset={handleReset}
        resultCount={total || properties.length}
        isLive={isLive}
      />

      {/* Properties Grid with Loading / Error / Empty states */}
      {(activeTab === 'both' || activeTab === 'grid') && (
        <div className="space-y-10">
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
          ) : properties.length > 0 ? (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {/* Load More Pagination */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8 py-3.5 bg-[#111116] hover:bg-[#15151c] text-[#f4f2ec] border border-white/10 hover:border-[#c5a880]/50 font-mono-luxury text-xs uppercase tracking-widest transition-all duration-300 rounded inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#c5a880]" />
                        <span>Loading Additional Listings...</span>
                      </>
                    ) : (
                      <>
                        <span>Load Additional Listings</span>
                        <ArrowDown className="w-3.5 h-3.5 text-[#c5a880]" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Bottom Attribution & Counter */}
              <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8e8d93]">
                <UnteraAttribution variant="inline" />
                <span className="font-mono-luxury text-[11px]">
                  Showing {properties.length} of {total} Verified Live Listings
                </span>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="compass"
              title="No Matching Live Listings Found"
              description="No active listings currently match the specified filters on the Untera MLS network. Try selecting another country, resetting price bounds, or clearing search keywords."
              actionText="Reset All Filters"
              onAction={handleReset}
            />
          )}
        </div>
      )}
    </div>
  );
};
