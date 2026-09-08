import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { AtlasProperty } from '@/types/property';
import { fetchProperties } from '@/services/propertyService';
import { DESTINATIONS } from '@/data/destinations';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AtlasProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(-1);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          e.preventDefault();
          const target = results[selectedIndex];
          onClose();
          navigate(`/property/${target.id}`);
        } else if (query.trim()) {
          e.preventDefault();
          onClose();
          navigate(`/explore?location=${encodeURIComponent(query.trim())}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results, query, onClose, navigate]);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    const handler = setTimeout(async () => {
      try {
        const response = await fetchProperties({ searchQuery: query.trim() }, controller.signal);
        setResults(response.properties.slice(0, 8));
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('[ATLAS] QuickSearch error:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [query]);

  // Destination filter
  const matchingDestinations = query.trim()
    ? DESTINATIONS.filter(d => 
        d.name.toLowerCase().includes(query.toLowerCase()) || 
        d.country.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4)
    : DESTINATIONS.slice(0, 4);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#08080a]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#111116] border border-[#c5a880]/30 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          {loading ? (
            <Loader2 className="w-5 h-5 text-[#c5a880] animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-[#c5a880]" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search live assets across 80+ countries by city, title, or style..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#f4f2ec] placeholder-[#8e8d93] outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {/* Territories & Hubs */}
          <div>
            <div className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-2 px-2">
              Territories & Hubs
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {matchingDestinations.map(dest => (
                <button
                  key={dest.id}
                  onClick={() => {
                    onClose();
                    navigate(`/explore?location=${encodeURIComponent(dest.name)}`);
                  }}
                  className="flex items-center justify-between p-2.5 rounded bg-white/[0.03] hover:bg-[#c5a880]/10 border border-transparent hover:border-[#c5a880]/30 text-left transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#c5a880]" />
                    <div>
                      <div className="text-xs font-medium text-[#f4f2ec]">{dest.name}</div>
                      <div className="text-[10px] text-[#8e8d93]">{dest.country} · {dest.propertyCount} assets</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8e8d93]" />
                </button>
              ))}
            </div>
          </div>

          {/* Live Properties */}
          {query.trim() && (
            <div>
              <div className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-2 px-2 flex items-center justify-between">
                <span>Matching Verified Listings</span>
                {loading && <span className="text-[#c5a880] lowercase">searching mls...</span>}
              </div>
              {results.length > 0 ? (
                <div className="space-y-1.5">
                  {results.map((prop, idx) => (
                    <button
                      key={prop.id}
                      onClick={() => {
                        onClose();
                        navigate(`/property/${prop.id}`);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded text-left transition-all ${
                        selectedIndex === idx
                          ? 'bg-[#c5a880]/20 border border-[#c5a880]'
                          : 'bg-white/[0.03] hover:bg-[#c5a880]/10 border border-transparent hover:border-[#c5a880]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={prop.images[0]} 
                          alt={prop.title}
                          className="w-10 h-10 object-cover rounded" 
                        />
                        <div>
                          <div className="text-xs font-medium text-[#f4f2ec] line-clamp-1">{prop.title}</div>
                          <div className="text-[11px] text-[#8e8d93]">
                            {prop.city}, {prop.country} · <span className="text-[#c5a880] font-mono-luxury">{prop.priceFormatted}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-mono-luxury px-2 py-0.5 rounded bg-white/5 text-[#8e8d93]">
                        {prop.propertyType}
                      </span>
                    </button>
                  ))}
                </div>
              ) : !loading ? (
                <div className="p-4 text-center text-xs text-[#8e8d93]">
                  No properties matching "{query}". Try a country or broader search term.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-[#8e8d93]">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 text-[9px] bg-white/10 rounded">ESC</kbd> to exit</span>
          <button
            onClick={() => {
              onClose();
              navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore');
            }}
            className="text-[#c5a880] hover:underline"
          >
            Explore all in catalogue →
          </button>
        </div>
      </div>
    </div>
  );
};
