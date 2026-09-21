import React, { useState, useEffect } from 'react';
import { 
  Building2, Globe, Palette, ShieldCheck, Sparkles, 
  Upload, Eye, CheckCircle2, Lock, Copy, Check, ArrowUpRight 
} from 'lucide-react';
import { DealerOrganization } from '@/types/commercial';

interface WhiteLabelSuiteViewProps {
  dealer: DealerOrganization | null;
}

export interface WhiteLabelConfig {
  agencyName: string;
  logoUrl: string;
  customDomain: string;
  primaryColor: string;
  accentColor: string;
  disclaimerWatermark: string;
  removeAtlasBranding: boolean;
  enableVipPasscode: boolean;
}

export const WhiteLabelSuiteView: React.FC<WhiteLabelSuiteViewProps> = ({ dealer }) => {
  const storageKey = `atlas_whitelabel_config_${dealer?.id || 'default'}`;

  const [config, setConfig] = useState<WhiteLabelConfig>({
    agencyName: dealer?.name || 'Crestview Capital Commercial',
    logoUrl: dealer?.logo_url || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
    customDomain: 'deals.crestview-commercial.com',
    primaryColor: '#c5a880',
    accentColor: '#10b981',
    disclaimerWatermark: 'STRICTLY CONFIDENTIAL · FOR INSTITUTIONAL LP USE ONLY',
    removeAtlasBranding: true,
    enableVipPasscode: true,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {}
    }
  }, [storageKey]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(storageKey, JSON.stringify(config));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const copyDomain = () => {
    navigator.clipboard.writeText(`https://${config.customDomain}`);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const colorPresets = [
    { label: 'Champagne Gold (Default)', primary: '#c5a880', accent: '#10b981' },
    { label: 'Morgan Stanley Blue', primary: '#2563eb', accent: '#38bdf8' },
    { label: 'Blackstone Onyx & Slate', primary: '#e2e8f0', accent: '#94a3b8' },
    { label: 'Mayfair Emerald', primary: '#059669', accent: '#34d399' },
    { label: 'Monaco Rose Gold', primary: '#f43f5e', accent: '#fda4af' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ENTERPRISE WHITE-LABEL SUITE · TIER 4 LICENSING</span>
          </div>
          <h2 className="font-editorial text-3xl text-[#f4f2ec]">Agency Brand & Domain Console</h2>
          <p className="text-xs text-[#8e8d93] font-light">
            Deploy your dedicated client deal rooms under your own custom domain, logo, and signature color palette with zero Atlas badges.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] text-xs font-mono-luxury font-semibold uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Deploy Branding Live</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-luxury flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Branding configuration published to custom domain Edge nodes.</span>
        </div>
      )}

      {/* Main Grid: Form Left, Live Client Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Form (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* Domain & Brand Identity */}
          <div className="p-6 rounded bg-[#111116] border border-white/10 space-y-4">
            <h3 className="font-editorial text-xl text-[#f4f2ec] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#c5a880]" />
              <span>Dedicated Domain & Hostname</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono-luxury uppercase text-[#8e8d93] mb-1">
                  Custom Domain CNAME Record
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 rounded bg-black/40 border border-white/10 text-[#8e8d93] font-mono-luxury text-xs">
                    https://
                  </span>
                  <input
                    type="text"
                    value={config.customDomain}
                    onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                    placeholder="deals.yourbrokerage.com"
                    className="flex-1 px-3 py-2 rounded bg-black/40 border border-white/10 text-[#f4f2ec] text-xs font-mono-luxury focus:outline-none focus:border-[#c5a880]"
                  />
                  <button
                    type="button"
                    onClick={copyDomain}
                    className="p-2 rounded bg-white/5 border border-white/10 text-[#8e8d93] hover:text-[#f4f2ec]"
                    title="Copy full domain URL"
                  >
                    {copiedDomain ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[#8e8d93] mt-1 font-light">
                  DNS target: Points to <code className="text-[#c5a880]">cname.atlas.commercial-proxy.net</code> with SSL auto-provisioning.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-mono-luxury uppercase text-[#8e8d93] mb-1">
                  Agency Display Name
                </label>
                <input
                  type="text"
                  value={config.agencyName}
                  onChange={(e) => setConfig({ ...config, agencyName: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-[#f4f2ec] text-xs focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono-luxury uppercase text-[#8e8d93] mb-1">
                  Agency Custom Logo URL
                </label>
                <input
                  type="url"
                  value={config.logoUrl}
                  onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                  placeholder="https://yourfirm.com/logo-white.svg"
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-[#f4f2ec] text-xs focus:outline-none focus:border-[#c5a880]"
                />
              </div>
            </div>
          </div>

          {/* Color Theming & Presets */}
          <div className="p-6 rounded bg-[#111116] border border-white/10 space-y-4">
            <h3 className="font-editorial text-xl text-[#f4f2ec] flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#c5a880]" />
              <span>Institutional Color Palette</span>
            </h3>

            {/* Quick presets */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">
                Curated Palettes
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {colorPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setConfig({ ...config, primaryColor: preset.primary, accentColor: preset.accent })}
                    className="p-2.5 rounded bg-black/40 border border-white/10 hover:border-white/30 text-left flex items-center justify-between transition-colors"
                  >
                    <span className="text-xs text-[#f4f2ec]">{preset.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.accent }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Color Pickers */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-mono-luxury uppercase text-[#8e8d93] mb-1">
                  Primary Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="w-9 h-9 rounded bg-transparent cursor-pointer border border-white/10"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="w-24 px-2 py-1.5 rounded bg-black/40 border border-white/10 text-xs font-mono-luxury text-[#f4f2ec]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono-luxury uppercase text-[#8e8d93] mb-1">
                  Secondary Highlight Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                    className="w-9 h-9 rounded bg-transparent cursor-pointer border border-white/10"
                  />
                  <input
                    type="text"
                    value={config.accentColor}
                    onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                    className="w-24 px-2 py-1.5 rounded bg-black/40 border border-white/10 text-xs font-mono-luxury text-[#f4f2ec]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise Toggles */}
          <div className="p-6 rounded bg-[#111116] border border-white/10 space-y-4">
            <h3 className="font-editorial text-xl text-[#f4f2ec] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#c5a880]" />
              <span>Enterprise White-Label Toggles</span>
            </h3>

            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between p-3 rounded bg-black/40 border border-white/10 cursor-pointer">
                <div>
                  <div className="font-mono-luxury text-[#f4f2ec]">Pure White-Label (Remove "Atlas" Badge)</div>
                  <div className="text-[10px] text-[#8e8d93] font-light">Eliminates all platform watermarks and links.</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.removeAtlasBranding}
                  onChange={(e) => setConfig({ ...config, removeAtlasBranding: e.target.checked })}
                  className="w-4 h-4 accent-[#c5a880]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded bg-black/40 border border-white/10 cursor-pointer">
                <div>
                  <div className="font-mono-luxury text-[#f4f2ec]">VIP Passcode Access Gate</div>
                  <div className="text-[10px] text-[#8e8d93] font-light">Requires custom access PIN for high-net-worth visitors.</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableVipPasscode}
                  onChange={(e) => setConfig({ ...config, enableVipPasscode: e.target.checked })}
                  className="w-4 h-4 accent-[#c5a880]"
                />
              </label>

              <div>
                <label className="block text-[10px] font-mono-luxury uppercase text-[#8e8d93] mb-1">
                  Presentation Deck Watermark
                </label>
                <input
                  type="text"
                  value={config.disclaimerWatermark}
                  onChange={(e) => setConfig({ ...config, disclaimerWatermark: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-[#f4f2ec] text-xs focus:outline-none focus:border-[#c5a880]"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Live Client Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Real-Time Client View Preview</span>
            </span>
            <span className="text-[10px] font-mono-luxury text-[#8e8d93]">Live Sandbox</span>
          </div>

          {/* Browser Mockup Window */}
          <div className="rounded-lg bg-[#08080a] border border-white/15 overflow-hidden shadow-2xl">
            {/* Browser Address Bar */}
            <div className="p-3 bg-[#111116] border-b border-white/10 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 px-3 py-1 rounded bg-black/60 border border-white/10 text-[10px] font-mono-luxury text-[#8e8d93] flex items-center justify-between truncate">
                <span>https://{config.customDomain}/mandates/skyline-tower</span>
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              </div>
            </div>

            {/* Branded Page Content Preview */}
            <div className="p-6 space-y-6">
              {/* Branded Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  {config.logoUrl ? (
                    <img 
                      src={config.logoUrl} 
                      alt="Agency Logo" 
                      className="w-8 h-8 rounded object-cover border border-white/20"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-[#c5a880]" />
                  )}
                  <div>
                    <div className="font-editorial text-sm text-[#f4f2ec] font-bold">
                      {config.agencyName}
                    </div>
                    <div className="text-[9px] font-mono-luxury uppercase text-[#8e8d93]">
                      Institutional Deal Room
                    </div>
                  </div>
                </div>

                <div 
                  className="px-2.5 py-1 rounded text-[10px] font-mono-luxury font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: `${config.primaryColor}20`, color: config.primaryColor, border: `1px solid ${config.primaryColor}50` }}
                >
                  VIP Data Room
                </div>
              </div>

              {/* Watermark Strip */}
              <div className="p-2 rounded bg-black/40 border border-white/5 text-[9px] font-mono-luxury text-center tracking-widest text-[#8e8d93]/80">
                {config.disclaimerWatermark}
              </div>

              {/* Simulated 3D Asset Card */}
              <div className="p-4 rounded bg-[#111116] border border-white/10 space-y-3">
                <div className="h-28 rounded bg-gradient-to-tr from-black/80 to-[#1a1a24] border border-white/10 flex items-center justify-center relative overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-15"
                    style={{ backgroundColor: config.primaryColor }}
                  />
                  <div className="text-center space-y-1 relative z-10">
                    <div className="text-xs font-editorial text-[#f4f2ec]">
                      3D BIM Architectural Scene
                    </div>
                    <div className="text-[9px] font-mono-luxury text-[#8e8d93]">
                      14-Story Commercial Trophy Tower
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-[#8e8d93]">In-Place NOI</div>
                    <div className="font-mono-luxury font-semibold text-[#f4f2ec]">$1,840,000 / yr</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8e8d93]">Cap Rate</div>
                    <div className="font-mono-luxury font-semibold" style={{ color: config.primaryColor }}>
                      6.42%
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded text-[10px] font-mono-luxury font-semibold uppercase"
                    style={{ backgroundColor: config.primaryColor, color: '#08080a' }}
                  >
                    Enter Deal Room
                  </button>
                </div>
              </div>

              {/* Footer attribution test */}
              <div className="pt-2 text-center text-[9px] font-mono-luxury text-[#8e8d93]">
                {config.removeAtlasBranding ? (
                  <span>© {new Date().getFullYear()} {config.agencyName}. All rights reserved. Private placement.</span>
                ) : (
                  <span>Powered by Atlas Spatial Real Estate Intelligence</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
