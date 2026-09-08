import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Globe2, Landmark, ArrowRight, ExternalLink } from 'lucide-react';
import { UnteraAttribution } from '@/components/ui/UnteraAttribution';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      {/* Title Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono-luxury uppercase tracking-[0.3em] text-[#c5a880]">
          ABOUT ATLAS & HM CODING
        </span>
        <h1 className="font-editorial text-5xl sm:text-6xl text-[#f4f2ec] leading-tight">
          A Global Lens for <br />
          <span className="italic text-[#c5a880]">Exceptional Real Estate.</span>
        </h1>
        <p className="text-sm sm:text-base text-[#8e8d93] font-light leading-relaxed">
          ATLAS is a unified cartographic discovery interface for exceptional property and global real-estate opportunities, engineered by HM Coding.
        </p>
      </div>

      {/* Narrative Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center pt-8 border-t border-white/[0.08]">
        <div className="space-y-4">
          <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            OUR PURPOSE
          </span>
          <h2 className="font-editorial text-3xl text-[#f4f2ec]">
            Unified International Discovery
          </h2>
          <p className="text-xs sm:text-sm text-[#8e8d93] leading-relaxed font-light">
            Traditional real-estate portals are fragmented by nation, language, and closed broker syndicates. ATLAS aggregates and normalizes property streams across international jurisdictions under a singular, intuitive 3D cartographic canvas.
          </p>
          <p className="text-xs sm:text-sm text-[#8e8d93] leading-relaxed font-light">
            ATLAS acts as an independent discovery engine. Listings showcased on ATLAS are syndicated from verified external MLS providers and multi-national brokerage networks. We do not hold title or ownership over individual listings, ensuring transparent provenance.
          </p>
        </div>

        <div className="p-8 rounded-sm bg-[#111116] border border-white/[0.08] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded border border-[#c5a880]/50 flex items-center justify-center text-[#c5a880]">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-editorial text-lg text-[#f4f2ec]">Data & Intelligence Network</div>
              <div className="text-[10px] font-mono-luxury text-[#8e8d93]">UNTERA REAL ESTATE MLS</div>
            </div>
          </div>
          <p className="text-xs text-[#8e8d93] leading-relaxed">
            Live listing inventory, pricing conversions, and the Global Property Index are powered by the Untera real-estate network, accessing over 3.9M+ listings across 80+ countries.
          </p>
          <div className="pt-2">
            <UnteraAttribution variant="badge" />
          </div>
        </div>
      </div>

      {/* Four Pillars */}
      <div className="space-y-8 pt-8 border-t border-white/[0.08]">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            THE FOUR CRITERIA
          </span>
          <h2 className="font-editorial text-3xl text-[#f4f2ec]">The Atlas Curation Standard</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-sm bg-[#111116] border border-white/[0.06] space-y-3">
            <div className="w-8 h-8 rounded bg-[#c5a880]/10 flex items-center justify-center text-[#c5a880]">
              <Landmark className="w-4 h-4" />
            </div>
            <h3 className="font-editorial text-lg text-[#f4f2ec]">Absolute Scarcity</h3>
            <p className="text-xs text-[#8e8d93] leading-relaxed">
              Properties occupying unique geographical parcels that can never be duplicated by future zoning or construction.
            </p>
          </div>

          <div className="p-6 rounded-sm bg-[#111116] border border-white/[0.06] space-y-3">
            <div className="w-8 h-8 rounded bg-[#c5a880]/10 flex items-center justify-center text-[#c5a880]">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-editorial text-lg text-[#f4f2ec]">Architectural Merit</h3>
            <p className="text-xs text-[#8e8d93] leading-relaxed">
              Masterpieces designed by visionary architects using noble materials: post-tensioned stone, solid brass, and raw timber.
            </p>
          </div>

          <div className="p-6 rounded-sm bg-[#111116] border border-white/[0.06] space-y-3">
            <div className="w-8 h-8 rounded bg-[#c5a880]/10 flex items-center justify-center text-[#c5a880]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-editorial text-lg text-[#f4f2ec]">Sovereign Privacy</h3>
            <p className="text-xs text-[#8e8d93] leading-relaxed">
              Enclaves equipped with multi-layered perimeter security, gated airspaces, and private shoreline rights.
            </p>
          </div>

          <div className="p-6 rounded-sm bg-[#111116] border border-white/[0.06] space-y-3">
            <div className="w-8 h-8 rounded bg-[#c5a880]/10 flex items-center justify-center text-[#c5a880]">
              <Globe2 className="w-4 h-4" />
            </div>
            <h3 className="font-editorial text-lg text-[#f4f2ec]">Capital Durability</h3>
            <p className="text-xs text-[#8e8d93] leading-relaxed">
              Assets situated in blue-chip financial jurisdictions offering generational capital preservation and legal clarity.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-10 rounded-sm bg-[#111116] border border-[#c5a880]/30 text-center space-y-6">
        <h3 className="font-editorial text-3xl sm:text-4xl text-[#f4f2ec]">
          Experience Global Discovery
        </h3>
        <p className="text-xs sm:text-sm text-[#8e8d93] max-w-lg mx-auto">
          Begin exploring live listings across sovereign territories or analyze our Global Property Index.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/explore"
            className="px-8 py-3.5 rounded-sm bg-[#c5a880] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold hover:bg-[#e2c295] transition-colors"
          >
            Explore the Globe
          </Link>
          <Link
            to="/markets"
            className="px-8 py-3.5 rounded-sm bg-transparent border border-white/10 text-[#f4f2ec] hover:border-[#c5a880] font-mono-luxury text-xs uppercase tracking-widest transition-colors"
          >
            Global Property Index
          </Link>
        </div>
      </div>
    </div>
  );
};
