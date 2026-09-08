import React from 'react';
import { PropertyFilterState } from '@/types/property';
import { DestinationCluster } from '@/types/destination';
import { RotateCcw } from 'lucide-react';

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
  return (
    <div className="bg-[#111116] border border-white/[0.08] p-5 rounded-sm space-y-5">
      {/* Top Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
            Search Location / Keyword
          </label>
          <input
            type="text"
            placeholder="City, region, title, or keyword..."
            value={filter.searchQuery || filter.location || ''}
            onChange={(e) => onChange({ 
              ...filter, 
              searchQuery: e.target.value,
              location: e.target.value 
            })}
            className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-xs text-[#f4f2ec] placeholder-[#5c5b62] focus:border-[#c5a880] outline-none"
          />
        </div>

        {/* Country Dropdown */}
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

        {/* Transaction Type */}
        <div>
          <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
            Transaction
          </label>
          <select
            value={filter.transactionType || ''}
            onChange={(e) => onChange({ ...filter, transactionType: e.target.value })}
            className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-xs text-[#f4f2ec] focus:border-[#c5a880] outline-none"
          >
            <option value="">All Transactions</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent / Lease</option>
          </select>
        </div>

        {/* Bedrooms Dropdown */}
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

        {/* Sort Order Dropdown */}
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

        {/* Result count & reset */}
        <div className="flex items-center gap-4 text-xs font-mono-luxury text-[#8e8d93]">
          <span className="text-[#c5a880] font-semibold">
            {resultCount} {isLive ? 'Live MLS Listings' : 'Verified Listings'}
          </span>
          <button
            onClick={onReset}
            className="flex items-center gap-1 hover:text-[#f4f2ec] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
