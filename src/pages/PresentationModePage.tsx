import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bed, Bath, Maximize2, MapPin, Calendar, 
  ChevronLeft, ChevronRight, X, Shield, Eye
} from 'lucide-react';
import { AtlasProperty } from '@/types/property';
import { fetchPropertyById } from '@/services/propertyService';
import { SpatialExperienceSection } from '@/components/property/spatial/SpatialExperienceSection';

export const PresentationModePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<AtlasProperty | null>(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'gallery' | 'spatial'>('gallery');

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    fetchPropertyById(id, controller.signal).then(res => {
      if (res) setProperty(res);
    });
    return () => controller.abort();
  }, [id]);

  if (!property) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f2ec] flex items-center justify-center font-mono-luxury text-xs">
        Loading Client Presentation Dossier...
      </div>
    );
  }

  const images = property.images && property.images.length > 0 ? property.images : [];
  const currentPhoto = images[currentPhotoIdx] || property.imageUrl;

  return (
    <div className="min-h-screen bg-[#060608] text-[#f4f2ec] flex flex-col justify-between selection:bg-[#c5a880] selection:text-[#08080a]">
      {/* Top Floating Header - Minimal, Presentation Grade */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-white/[0.06] bg-[#08080a]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/property/${property.id}`)}
            className="flex items-center gap-2 text-xs font-mono-luxury uppercase tracking-widest text-[#8e8d93] hover:text-[#f4f2ec] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Presentation</span>
          </button>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c5a880] animate-pulse" />
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
              Dealer Client Mode
            </span>
          </div>
        </div>

        {/* Presentation Switcher */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-sm border border-white/10">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-3 py-1 rounded text-xs font-mono-luxury uppercase tracking-wider transition-colors ${
              activeTab === 'gallery' ? 'bg-[#c5a880] text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'
            }`}
          >
            Photography
          </button>
          <button
            onClick={() => setActiveTab('spatial')}
            className={`px-3 py-1 rounded text-xs font-mono-luxury uppercase tracking-wider transition-colors ${
              activeTab === 'spatial' ? 'bg-[#c5a880] text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'
            }`}
          >
            3D Spatial & Rotunda
          </button>
        </div>

        <div className="text-right">
          <div className="font-editorial text-xl text-[#f4f2ec]">{property.priceFormatted}</div>
          <div className="text-[10px] font-mono-luxury text-[#8e8d93] uppercase tracking-wider">
            {property.city}, {property.country}
          </div>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main className="flex-1 flex flex-col p-6 sm:p-10 max-w-7xl mx-auto w-full">
        {activeTab === 'gallery' ? (
          <div className="flex-1 flex flex-col space-y-6">
            {/* Massive Cinema Frame */}
            <div className="relative flex-1 min-h-[60vh] rounded-sm overflow-hidden border border-white/10 bg-black/80 flex items-center justify-center group">
              {currentPhoto ? (
                <img
                  key={currentPhoto}
                  src={currentPhoto}
                  alt={property.title}
                  className="max-h-[75vh] w-auto max-w-full object-contain mx-auto"
                />
              ) : null}

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPhotoIdx((currentPhotoIdx - 1 + images.length) % images.length)}
                    className="absolute left-4 p-3 rounded-full bg-black/60 hover:bg-[#c5a880] text-[#f4f2ec] hover:text-[#08080a] transition-all border border-white/10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPhotoIdx((currentPhotoIdx + 1) % images.length)}
                    className="absolute right-4 p-3 rounded-full bg-black/60 hover:bg-[#c5a880] text-[#f4f2ec] hover:text-[#08080a] transition-all border border-white/10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 left-4 px-3 py-1 rounded bg-black/80 border border-white/10 text-xs font-mono-luxury text-[#c5a880]">
                Frame {currentPhotoIdx + 1} of {images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhotoIdx(i)}
                    className={`relative w-24 h-16 shrink-0 rounded overflow-hidden border transition-all ${
                      currentPhotoIdx === i ? 'border-[#c5a880] ring-2 ring-[#c5a880]/50' : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1">
            <SpatialExperienceSection
              property={property}
            />
          </div>
        )}

        {/* Bottom Property Key Specs */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="font-editorial text-3xl text-[#f4f2ec]">{property.title}</h1>
            <p className="text-xs text-[#8e8d93] mt-1">{property.displayLocation || `${property.city}, ${property.country}`}</p>
          </div>

          <div className="flex items-center gap-8 text-xs font-mono-luxury">
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-2 text-[#f4f2ec]">
                <Bed className="w-4 h-4 text-[#c5a880]" />
                <span>{property.bedrooms} Bedrooms</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-2 text-[#f4f2ec]">
                <Bath className="w-4 h-4 text-[#c5a880]" />
                <span>{property.bathrooms} Baths</span>
              </div>
            )}
            {property.areaSqm > 0 && (
              <div className="flex items-center gap-2 text-[#f4f2ec]">
                <Maximize2 className="w-4 h-4 text-[#c5a880]" />
                <span>{property.areaSqm.toLocaleString()} m²</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
