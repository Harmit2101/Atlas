import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ShieldCheck, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0c0c10] border-t border-white/[0.08] text-[#8e8d93] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 pb-16 border-b border-white/[0.06]">
          {/* Brand Manifesto */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-7 h-7 rounded border border-[#c5a880]/60 flex items-center justify-center bg-[#111116]">
                <span className="font-editorial text-base text-[#c5a880] font-semibold">A</span>
              </div>
              <span className="font-editorial text-xl tracking-[0.25em] text-[#f4f2ec] font-semibold">
                ATLAS
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-[#8e8d93] max-w-sm">
              ATLAS is a global discovery intelligence platform for rare architectural real estate, private islands, and generational assets. Connecting discerning collectors with exceptional properties across the planet.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono-luxury text-[#c5a880] pt-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CONFIDENTIAL · OFF-MARKET PROTOCOLS AVAILABLE</span>
            </div>
          </div>

          {/* Hubs */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono-luxury uppercase tracking-widest text-[#f4f2ec]">
              Premier Hubs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/explore?destination=dubai" className="hover:text-[#c5a880] transition-colors">Dubai, UAE</Link>
              </li>
              <li>
                <Link to="/explore?destination=london" className="hover:text-[#c5a880] transition-colors">London, UK</Link>
              </li>
              <li>
                <Link to="/explore?destination=new-york" className="hover:text-[#c5a880] transition-colors">New York City, US</Link>
              </li>
              <li>
                <Link to="/explore?destination=amalfi-coast" className="hover:text-[#c5a880] transition-colors">Amalfi Coast, IT</Link>
              </li>
              <li>
                <Link to="/explore?destination=tokyo" className="hover:text-[#c5a880] transition-colors">Tokyo, JP</Link>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono-luxury uppercase tracking-widest text-[#f4f2ec]">
              Discovery & Network
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/explore" className="hover:text-[#c5a880] transition-colors flex items-center gap-1">
                  Global Map <ArrowUpRight className="w-3 h-3 text-[#c5a880]" />
                </Link>
              </li>
              <li>
                <Link to="/private-client" className="hover:text-[#c5a880] transition-colors text-[#c5a880]">
                  Private Client Suite
                </Link>
              </li>
              <li>
                <Link to="/dealer" className="hover:text-[#c5a880] transition-colors">
                  Partner Broker Portal
                </Link>
              </li>
              <li>
                <Link to="/saved" className="hover:text-[#c5a880] transition-colors">Saved Portfolio</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#c5a880] transition-colors">Private Advisory</Link>
              </li>
            </ul>
          </div>

          {/* Legal / Disclaimer */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono-luxury uppercase tracking-widest text-[#f4f2ec]">
              Transparency
            </h4>
            <p className="text-[11px] leading-relaxed text-[#8e8d93]">
              Listing representations are curated architectural samples for conceptual demonstration and discovery. No binding brokerage or solicitation is intended.
            </p>
            <div className="pt-2 text-[10px] font-mono-luxury text-[#c5a880]">
              CURRENCY BENCHMARK: USD ($)
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>ATLAS by HM Coding © {new Date().getFullYear()}. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-[11px] font-mono-luxury uppercase tracking-wider text-[#8e8d93]">
            <span>Privacy Policy</span>
            <span>Terms of Access</span>
            <span>Anti-Financial Crime</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
