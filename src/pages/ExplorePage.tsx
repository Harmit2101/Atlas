import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlobeScene } from '@/components/globe/GlobeScene';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyFilterBar } from '@/components/property/PropertyFilterBar';
import { PropertySkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { UnteraAttribution } from '@/components/ui/UnteraAttribution';
import { useProperties } from '@/hooks/useProperties';
import { useDestinations } from '@/hooks/useDestinations';
import { PropertyFilterState } from '@/types/property';
import { Globe2 } from 'lucide-react';

const INITIAL_FILTER: PropertyFilterState = {
  country: '',
  location: '',
  destinationId: '',
  propertyType: '',
  transactionType: '',
  minPrice: 0,
  maxPrice: 200000000,
  bedrooms: '',
  searchQuery: '',
  sortBy: 'featured',
  page: 1
};

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<PropertyFilterState>(() => {
    const loc = searchParams.get('location') || searchParams.get('destination') || '';
    const q = searchParams.get('q') || '';
    return {
      ...INITIAL_FILTER,
      location: loc,
      destinationId: loc,
      searchQuery: q
    };
  });

  const [activeTab, setActiveTab] = useState<'both' | 'globe' | 'grid'>('both');

  // Query live properties
  const { properties, loading, error, total, isLive, refetch } = useProperties(filter);

  // Derive dynamic destination clusters from properties
  const { destinations } = useDestinations(properties);

  // Sync searchParams with filter state
  useEffect(() => {
    const locParam = searchParams.get('location') || searchParams.get('destination');
    const qParam = searchParams.get('q');

    setFilter(prev => ({
      ...prev,
      location: locParam || '',
      destinationId: locParam || '',
      searchQuery: qParam || prev.searchQuery
    }));
  }, [searchParams]);

  const handleFilterChange = (newFilter: PropertyFilterState) => {
    setFilter(newFilter);
    const params: Record<string, string> = {};
    if (newFilter.location) params.location = newFilter.location;
    if (newFilter.searchQuery) params.q = newFilter.searchQuery;
    setSearchParams(params);
  };

  const handleReset = () => {
    setFilter(INITIAL_FILTER);
    setSearchParams({});
  };

  const activeHubName = filter.location || filter.destinationId || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-[#c5a880]">
            GLOBAL DISCOVERY ENGINE
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#f4f2ec] mt-1">
            {activeHubName ? `Territory: ${activeHubName}` : 'Global Exploration'}
          </h1>
          <p className="text-xs text-[#8e8d93] mt-1 max-w-xl">
            {isLive
              ? `Exploring live real estate listings from Untera global MLS across 80+ international territories.`
              : `Explore exceptional real estate across ${destinations.length} international hubs.`}
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

      {/* 3D Globe Section (Seamless - no card box) */}
      {(activeTab === 'both' || activeTab === 'globe') && (
        <div className="relative w-full rounded-sm overflow-hidden bg-transparent">
          <GlobeScene
            height={activeTab === 'globe' ? 'h-[720px]' : 'h-[440px] sm:h-[500px]'}
            destinations={destinations}
            selectedDestinationId={filter.destinationId}
            onDestinationSelect={(dest) => {
              handleFilterChange({
                ...filter,
                destinationId: dest.name,
                location: dest.name
              });
            }}
          />
        </div>
      )}

      {/* Live Filter Bar */}
      <PropertyFilterBar
        filter={filter}
        onChange={handleFilterChange}
        onReset={handleReset}
        resultCount={total || properties.length}
        destinations={destinations}
        isLive={isLive}
      />

      {/* Properties Grid with Loading / Error / Empty states */}
      {(activeTab === 'both' || activeTab === 'grid') && (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertySkeleton key={i} />
              ))}
            </div>
          ) : error && properties.length === 0 ? (
            <ErrorState
              title="Listing Stream Error"
              message={error}
              onRetry={refetch}
            />
          ) : properties.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {/* Bottom Attribution */}
              <div className="pt-8 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#8e8d93]">
                <UnteraAttribution variant="inline" />
                <span className="font-mono-luxury text-[11px]">
                  Showing {properties.length} of {total} Available Listings
                </span>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="compass"
              title="No Matching Assets Found"
              description="No active listings currently match the specified filters. Try selecting another hub, resetting price bounds, or clearing search keywords."
              actionText="Reset All Filters"
              onAction={handleReset}
            />
          )}
        </div>
      )}
    </div>
  );
};
