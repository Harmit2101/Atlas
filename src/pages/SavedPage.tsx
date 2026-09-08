import React, { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { AtlasProperty } from '@/types/property';
import { fetchPropertyById } from '@/services/propertyService';
import { PropertyCard } from '@/components/property/PropertyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { UnteraAttribution } from '@/components/ui/UnteraAttribution';

export const SavedPage: React.FC = () => {
  const { savedIds, clearAll, isAuthenticated } = useSavedProperties();
  const [properties, setProperties] = useState<AtlasProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSavedListings() {
      if (savedIds.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const loaded = await Promise.all(
          savedIds.map(id => fetchPropertyById(id))
        );
        if (mounted) {
          setProperties(loaded.filter(Boolean) as AtlasProperty[]);
        }
      } catch (e) {
        console.warn('[ATLAS] Error loading saved property details:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSavedListings();

    return () => {
      mounted = false;
    };
  }, [savedIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-[#c5a880]">
            {isAuthenticated ? 'SUPABASE CLOUD PORTFOLIO' : 'LOCAL TEMPORARY PORTFOLIO'}
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#f4f2ec] mt-1">
            Private Collection
          </h1>
          <p className="text-xs text-[#8e8d93] mt-1">
            {isAuthenticated 
              ? 'Your authenticated acquisitions portfolio synchronized with Supabase cloud infrastructure.'
              : 'Sign in to permanently preserve and synchronize your portfolio across devices.'}
          </p>
        </div>

        {properties.length > 0 && (
          <div className="flex items-center gap-4">
            <UnteraAttribution variant="badge" />
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs font-mono-luxury uppercase text-[#8e8d93] hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Collection ({properties.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#c5a880] animate-spin" />
          <span className="text-xs font-mono-luxury uppercase tracking-widest text-[#8e8d93]">
            Retrieving Saved Acquisitions...
          </span>
        </div>
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="bookmark"
          title="Your collection is waiting."
          description="As you navigate the world, click the bookmark icon on any card or detail page to curate your personal acquisition shortlist."
          actionText="Explore Exceptional Assets"
          actionHref="/explore"
        />
      )}
    </div>
  );
};
