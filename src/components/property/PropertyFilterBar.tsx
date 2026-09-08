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
  'Villa',
  'Penthouse',
  'Apartment',
  'House',
  'Estate',
  'Chalet'
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Search Input */}
        <div>
          <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
            Search Term
          </label>
          <input
            type="text"
            placeholder="Title, architectural style, or keyword..."
            value={filter.searchQuery || ''}
            onChange={(e) => onChange({ ...filter, searchQuery: e.target.value })}
            className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-xs text-[#f4f2ec] placeholder-[#5c5b62] focus:border-[#c5a880] outline-none"
          />
        </div>

        {/* Destination / Hub Dropdown */}
        <div>
          <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
            Territory / Hub
          </label>
          <select
            value={filter.destinationId || filter.location || ''}
            onChange={(e) => {
              const val = e.target.value;
              onChange({ 
                ...filter, 
                destinationId: val,
                location: val 
              });
            }}
            className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-xs text-[#f4f2ec] focus:border-[#c5a880] outline-none"
          >
            <option value="">All Global Hubs ({destinations.length})</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}, {d.country} ({d.propertyCount})
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
            <option value="">All Acquisitions</option>
            <option value="sale">Private Sale</option>
            <option value="rent">Seasonal Sovereign Lease</option>
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
            <option value="3">3+ Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
            <option value="5">5+ Bedrooms</option>
            <option value="6">6+ Bedrooms</option>
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
            <option value="featured">Atlas Curated First</option>
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
                  propertyType: filter.propertyType === type ? '' : type
                })
              }
              className={`text-[11px] font-mono-luxury uppercase px-3 py-1 rounded transition-colors ${
                filter.propertyType === type
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
            {resultCount} {isLive ? 'Live MLS Assets' : 'Curated Assets'}
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
