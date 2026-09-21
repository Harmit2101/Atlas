import React from 'react';
import { PropertyFilterState } from '@/types/property';
import { DestinationCluster } from '@/types/destination';
import { RotateCcw, Filter, DollarSign, Search, MapPin } from 'lucide-react';

interface PropertyFilterBarProps {
  filter: PropertyFilterState;
  onChange: (newFilter: PropertyFilterState) => void;
  onReset: () => void;
  resultCount: number;
  destinations?: DestinationCluster[];
  isLive?: boolean;
}

const PROPERTY_TYPES = [
  'Residential',
  'Villa',
  'Apartment',
  'House',
  'Penthouse',
  'Commercial',
  'Land'
];

const POPULAR_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panama' },
  { code: 'GH', name: 'Ghana' }
];

export const PropertyFilterBar: React.FC<PropertyFilterBarProps> = ({
  filter,
  onChange,
  onReset,
  resultCount,
  destinations = [],
  isLive = false
}) => {
  // Compute active segment state
  const activeSegment = filter.tier || filter.transactionType || 'all';

  const handleSegmentChange = (segment: string) => {
    if (segment === 'all') {
      onChange({ ...filter, transactionType: '', tier: '' });
    } else if (segment === 'sale') {
      onChange({ ...filter, transactionType: 'sale', tier: '' });
    } else if (segment === 'rent') {
      onChange({ ...filter, transactionType: 'rent', tier: '' });
    } else if (segment === 'high-value-sale') {
      onChange({ ...filter, transactionType: 'sale', tier: 'high-value-sale' });
    } else if (segment === 'ultra-luxury-rent') {
      onChange({ ...filter, transactionType: 'rent', tier: 'ultra-luxury-rent' });
    }
  };

  return (
    <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-sm space-y-5">
      {/* Tier & Intent Segmented Bar (Phase 4 & 5) */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#c5a880]" />
            <span>INVENTORY TIER:</span>
          </span>

          <button
            type="button"
            onClick={() => handleSegmentChange('all')}
            className={`text-[11px] font-mono-luxury uppercase px-3 py-1.5 rounded transition-all ${
              activeSegment === 'all'
                ? 'bg-[#c5a880] text-[#08080a] font-semibold shadow-md'
                : 'bg-white/5 text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/10'
            }`}
          >
            All Luxury ($300k+)
          </button>

          <button
            type="button"
            onClick={() => handleSegmentChange('sale')}
            className={`text-[11px] font-mono-luxury uppercase px-3 py-1.5 rounded transition-all ${
              activeSegment === 'sale' && !filter.tier
                ? 'bg-[#c5a880] text-[#08080a] font-semibold shadow-md'
                : 'bg-white/5 text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/10'
            }`}
          >
            For Sale ($300k+)
          </button>

          <button
            type="button"
            onClick={() => handleSegmentChange('rent')}
            className={`text-[11px] font-mono-luxury uppercase px-3 py-1.5 rounded transition-all ${
              activeSegment === 'rent' && !filter.tier
                ? 'bg-[#1e2738] text-[#86b5e0] border border-[#374e70] font-semibold shadow-md'
                : 'bg-white/5 text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/10'
            }`}
          >
            For Rent ($5k+/Day)
          </button>

          <button
            type="button"
            onClick={() => handleSegmentChange('high-value-sale')}
            className={`text-[11px] font-mono-luxury uppercase px-3 py-1.5 rounded transition-all ${
              filter.tier === 'high-value-sale'
                ? 'bg-[#c5a880] text-[#08080a] font-semibold shadow-md ring-1 ring-[#c5a880]'
                : 'bg-white/5 text-[#c5a880] hover:text-[#f4f2ec] hover:bg-[#c5a880]/15'
            }`}
          >
            ★ High-Value Sales ($300k+)
          </button>

          <button
            type="button"
            onClick={() => handleSegmentChange('ultra-luxury-rent')}
            className={`text-[11px] font-mono-luxury uppercase px-3 py-1.5 rounded transition-all ${
              filter.tier === 'ultra-luxury-rent'
                ? 'bg-[#152033] text-[#8ec5fc] border border-[#446a9e] font-semibold shadow-md'
                : 'bg-white/5 text-[#8ec5fc] hover:text-[#f4f2ec] hover:bg-[#152033]/40'
            }`}
          >
            ◆ Ultra-Luxury Rentals ($5k+/Day)
          </button>
        </div>

        {/* Live MLS Counter */}
        <div className="flex items-center gap-3 text-xs font-mono-luxury text-[#8e8d93]">
          <span className="text-[#c5a880] font-semibold">
            {resultCount} {isLive ? 'Live MLS Listings' : 'Verified Listings'}
          </span>
          <button
            onClick={onReset}
            className="flex items-center gap-1 hover:text-[#f4f2ec] transition-colors p-1"
            title="Reset All Filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Top Filter Controls: Distinct Query vs Location (Phase 10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* 1. Keyword Search (searchQuery) */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5 flex items-center gap-1">
            <Search className="w-3 h-3 text-[#c5a880]" />
            <span>Keyword / Style / Title</span>
          </label>
          <input
            type="text"
            placeholder="Penthouse, waterfront, marble..."
            value={filter.searchQuery || ''}
            onChange={(e) => onChange({ 
              ...filter, 
              searchQuery: e.target.value
            })}
            className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-xs text-[#f4f2ec] placeholder-[#5c5b62] focus:border-[#c5a880] outline-none"
          />
        </div>

        {/* 2. Geographic Location (location) */}
        <div>
          <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#c5a880]" />
            <span>City / Territory</span>
          </label>
          <input
            type="text"
            placeholder="Dubai, Manhattan..."
            value={filter.location || ''}
            onChange={(e) => onChange({ 
              ...filter, 
              location: e.target.value
            })}
            className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-xs text-[#f4f2ec] placeholder-[#5c5b62] focus:border-[#c5a880] outline-none"
          />
        </div>

        {/* 3. Country Dropdown */}
        <div>
          <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
            Country / Region
          </label>
          <select
            value={filter.country || ''}
            onChange={(e) => onChange({ ...filter, country: e.target.value })}
            className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-xs text-[#f4f2ec] focus:border-[#c5a880] outline-none"
          >
            <option value="">All Countries</option>
            {POPULAR_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* 4. Bedrooms Dropdown */}
        <div>
          <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
            Bedrooms
          </label>
          <select
            value={filter.bedrooms || ''}
            onChange={(e) => onChange({ ...filter, bedrooms: e.target.value })}
            className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-xs text-[#f4f2ec] focus:border-[#c5a880] outline-none"
          >
            <option value="">Any Bedrooms</option>
            <option value="1">1+ Bedrooms</option>
            <option value="2">2+ Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
            <option value="5">5+ Bedrooms</option>
          </select>
        </div>

        {/* 5. Sort Order */}
        <div>
          <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
            Sort Order
          </label>
          <select
            value={filter.sortBy || 'featured'}
            onChange={(e) => onChange({ ...filter, sortBy: e.target.value as any })}
            className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-xs text-[#f4f2ec] focus:border-[#c5a880] outline-none"
          >
            <option value="featured">Featured First</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="area-desc">Area: Largest First</option>
          </select>
        </div>
      </div>

      {/* Asset Type Chips */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onChange({ ...filter, propertyType: '' })}
            className={`text-[11px] font-mono-luxury uppercase px-3 py-1 rounded transition-colors ${
              !filter.propertyType
                ? 'bg-[#c5a880] text-[#08080a] font-semibold'
                : 'bg-white/5 text-[#8e8d93] hover:text-[#f4f2ec]'
            }`}
          >
            All Types
          </button>
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                onChange({
                  ...filter,
                  propertyType: filter.propertyType?.toLowerCase() === type.toLowerCase() ? '' : type.toLowerCase()
                })
              }
              className={`text-[11px] font-mono-luxury uppercase px-3 py-1 rounded transition-colors ${
                filter.propertyType?.toLowerCase() === type.toLowerCase()
                  ? 'bg-[#c5a880] text-[#08080a] font-semibold'
                  : 'bg-white/5 text-[#8e8d93] hover:text-[#f4f2ec]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
