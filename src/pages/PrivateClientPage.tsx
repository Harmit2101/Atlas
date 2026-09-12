import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getBuyerPreferences, 
  saveBuyerPreferences, 
  evaluatePropertyMatch, 
  PropertyMatchResult 
} from '@/services/dealerService';
import { fetchProperties } from '@/services/propertyService';
import { fetchInquiries } from '@/services/commercialService';
import { BuyerPreferences, Inquiry } from '@/types/commercial';
import { AtlasProperty } from '@/types/property';
import { PropertyCard } from '@/components/property/PropertyCard';
import { 
  Compass, Bookmark, Send, Sparkles, Check, 
  Loader2, ArrowRight, Shield, SlidersHorizontal, Lock
} from 'lucide-react';

export const PrivateClientPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'brief' | 'matches' | 'inquiries' | 'concierge'>('brief');
  const [prefs, setPrefs] = useState<BuyerPreferences | null>(null);
  const [matches, setMatches] = useState<PropertyMatchResult[]>([]);
  const [userInquiries, setUserInquiries] = useState<Inquiry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Form state
  const [marketsInput, setMarketsInput] = useState('Dubai, London, Côte d\'Azur');
  const [budgetMin, setBudgetMin] = useState('2000000');
  const [budgetMax, setBudgetMax] = useState('15000000');
  const [minBeds, setMinBeds] = useState('3');
  const [purpose, setPurpose] = useState('second_home');
  const [timeline, setTimeline] = useState('1_to_3_months');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user) return;
    loadClientData();
  }, [user]);

  async function loadClientData() {
    if (!user) return;
    const existing = await getBuyerPreferences(user.id);
    if (existing) {
      setPrefs(existing);
      setMarketsInput(existing.preferred_markets?.join(', ') || '');
      setBudgetMin(existing.budget_min ? String(existing.budget_min) : '');
      setBudgetMax(existing.budget_max ? String(existing.budget_max) : '');
      setMinBeds(String(existing.min_bedrooms || 3));
      setPurpose(existing.purchase_purpose || 'second_home');
      setTimeline(existing.purchase_timeline || '1_to_3_months');
      setNotes(existing.notes || '');
      loadMatches(existing);
    } else {
      // Create initial recommendation based on default inputs
      loadMatches({
        id: '',
        user_id: user.id,
        preferred_markets: ['Dubai', 'London', 'France', 'United States'],
        budget_min: 2000000,
        budget_max: 20000000,
        currency: 'USD',
        property_types: ['villa', 'penthouse'],
        min_bedrooms: 3,
        purchase_purpose: 'second_home',
        purchase_timeline: '1_to_3_months',
        must_have_features: [],
        updated_at: new Date().toISOString()
      });
    }

    const inqs = await fetchInquiries();
    setUserInquiries(inqs.filter(i => i.user_id === user.id || i.email.toLowerCase() === user.email.toLowerCase()));
  }

  async function loadMatches(preferences: BuyerPreferences) {
    setLoadingMatches(true);
    try {
      const res = await fetchProperties();
      const matched = res.properties.map(p => evaluatePropertyMatch(p, preferences));
      // Sort by match score descending
      matched.sort((a, b) => b.matchScore - a.matchScore);
      setMatches(matched.slice(0, 9));
    } catch {}
    setLoadingMatches(false);
  }

  const handleSaveBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveSuccess(false);

    const markets = marketsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload: Omit<BuyerPreferences, 'id' | 'updated_at'> = {
      user_id: user.id,
      preferred_markets: markets,
      budget_min: budgetMin ? Number(budgetMin) : undefined,
      budget_max: budgetMax ? Number(budgetMax) : undefined,
      currency: 'USD',
      property_types: ['villa', 'penthouse', 'estate'],
      min_bedrooms: Number(minBeds),
      purchase_purpose: purpose,
      purchase_timeline: timeline,
      must_have_features: [],
      notes
    };

    await saveBuyerPreferences(payload);
    setSaving(false);
    setSaveSuccess(true);
    await loadClientData();
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('matches');
    }, 1200);
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-mono-luxury text-xs text-[#8e8d93]">
        Authenticating Private Client Credentials...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-24 p-8 bg-[#111116] border border-[#c5a880]/30 rounded text-center space-y-5">
        <Lock className="w-10 h-10 text-[#c5a880] mx-auto" />
        <h2 className="font-editorial text-3xl text-[#f4f2ec]">Atlas Private Client Access</h2>
        <p className="text-xs text-[#8e8d93] leading-relaxed">
          The Private Client suite provides confidential mandate management, deterministic cross-border property matching, and direct introductions with verified regional partner dealers.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs font-semibold uppercase tracking-widest"
          >
            Authenticate / Join Private Client
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            <Shield className="w-3.5 h-3.5" />
            <span>CONFIDENTIAL ACQUISITION SUITE · {user.displayName}</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#f4f2ec] mt-1">Atlas Private Client</h1>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs font-mono-luxury text-[#8e8d93]">
          <span>Client Tier:</span>
          <span className="text-[#c5a880] font-semibold uppercase">Private Client</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/[0.06] pb-3 text-xs font-mono-luxury uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('brief')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'brief' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          Acquisition Brief
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'matches' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          Deterministic Matches ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'inquiries' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          My Inquiries ({userInquiries.length})
        </button>
        <button
          onClick={() => setActiveTab('concierge')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'concierge' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          Private Advisory
        </button>
      </div>

      {/* ACQUISITION BRIEF TAB */}
      {activeTab === 'brief' && (
        <div className="max-w-3xl bg-[#111116] border border-white/10 rounded p-6 sm:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
              MANDATE CRITERIA
            </span>
            <h3 className="font-editorial text-2xl text-[#f4f2ec]">Acquisition Parameters</h3>
            <p className="text-xs text-[#8e8d93] mt-1">
              Atlas matches your criteria deterministically against live global listings and direct partner inventory without sharing your personal identity.
            </p>
          </div>

          {saveSuccess ? (
            <div className="py-8 text-center space-y-2">
              <Check className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-editorial text-xl text-[#f4f2ec]">Mandate Updated</h4>
              <p className="text-xs text-[#8e8d93]">Recalculating global property matches...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveBrief} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                  Target Global Markets (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dubai, London, Aspen, Cap d'Antibes"
                  value={marketsInput}
                  onChange={e => setMarketsInput(e.target.value)}
                  className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none focus:border-[#c5a880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Minimum Budget (USD)
                  </label>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={e => setBudgetMin(e.target.value)}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Maximum Budget (USD)
                  </label>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={e => setBudgetMax(e.target.value)}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Min Bedrooms
                  </label>
                  <select
                    value={minBeds}
                    onChange={e => setMinBeds(e.target.value)}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-2.5 py-2 text-[#f4f2ec] outline-none"
                  >
                    <option value="1">1+ Bedrooms</option>
                    <option value="2">2+ Bedrooms</option>
                    <option value="3">3+ Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                    <option value="5">5+ Bedrooms</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Acquisition Purpose
                  </label>
                  <select
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-2.5 py-2 text-[#f4f2ec] outline-none"
                  >
                    <option value="second_home">Secondary Estate</option>
                    <option value="primary_residence">Primary Residence</option>
                    <option value="investment">Capital Yield / Preservation</option>
                    <option value="development">Development Mandate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Target Horizon
                  </label>
                  <select
                    value={timeline}
                    onChange={e => setTimeline(e.target.value)}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-2.5 py-2 text-[#f4f2ec] outline-none"
                  >
                    <option value="immediate">&lt; 30 Days</option>
                    <option value="1_to_3_months">1 to 3 Months</option>
                    <option value="3_to_6_months">3 to 6 Months</option>
                    <option value="exploratory">Exploratory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                  Confidential Instructions / Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Must accommodate private helicopter landing, direct deepwater mooring, security perimeter..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save & Align Matches</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* DETERMINISTIC MATCHES TAB */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
                DETERMINISTIC ACQUISITION ENGINE
              </span>
              <h3 className="font-editorial text-2xl text-[#f4f2ec]">
                Aligned Portfolio ({matches.length})
              </h3>
            </div>
            <button
              onClick={() => prefs && loadMatches(prefs)}
              className="text-xs font-mono-luxury uppercase text-[#c5a880] hover:underline"
            >
              Re-Scan Global Index →
            </button>
          </div>

          {loadingMatches ? (
            <div className="py-24 text-center space-y-3 font-mono-luxury text-xs text-[#8e8d93]">
              <Loader2 className="w-6 h-6 animate-spin text-[#c5a880] mx-auto" />
              <p>Evaluating global property specifications against your acquisition brief...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="p-12 text-center bg-[#111116] border border-white/5 rounded text-xs text-[#8e8d93] font-mono-luxury">
              No active listings currently meet 100% of your constraints. Expand budget or market criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {matches.map(({ property, matchTier, matchScore, reasons }) => (
                <div key={property.id} className="space-y-2">
                  <div className="flex items-center justify-between px-1 text-[11px] font-mono-luxury">
                    <span className={`font-semibold ${
                      matchTier === 'Strong Match' ? 'text-emerald-400' : 'text-amber-300'
                    }`}>
                      {matchTier} ({matchScore}%)
                    </span>
                    <span className="text-[#8e8d93] text-[10px]">{reasons[0]}</span>
                  </div>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MY INQUIRIES TAB */}
      {activeTab === 'inquiries' && (
        <div className="bg-[#111116] border border-white/10 rounded overflow-hidden">
          {userInquiries.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8e8d93] font-mono-luxury">
              You have not submitted any property inquiries yet.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] text-xs">
              {userInquiries.map(inq => (
                <div key={inq.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#f4f2ec]">
                        {inq.property_title || `Property ID: ${inq.property_id}`}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#c5a880]/20 text-[#c5a880] text-[10px] font-mono-luxury uppercase font-medium">
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-[#8e8d93] text-[11px]">Submitted {new Date(inq.created_at).toLocaleDateString()}</p>
                    <p className="text-[#f4f2ec] text-xs italic mt-1">"{inq.message}"</p>
                  </div>
                  <Link
                    to={`/property/${inq.property_id}`}
                    className="text-xs text-[#c5a880] hover:underline font-mono-luxury uppercase"
                  >
                    View Asset →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONCIERGE TAB */}
      {activeTab === 'concierge' && (
        <div className="bg-[#111116] border border-white/10 rounded p-8 max-w-2xl space-y-4">
          <h3 className="font-editorial text-2xl text-[#f4f2ec]">Private Advisory Protocol</h3>
          <p className="text-xs text-[#8e8d93] leading-relaxed font-light">
            Atlas acts as a confidential discovery and acquisition intelligence platform. For off-market mandates, sovereign tax structures, or escrow partner introductions, contact the private advisory desk directly.
          </p>
          <div className="pt-2 text-xs font-mono-luxury text-[#c5a880]">
            Direct Advisory: advisory@hmcoding.com · PGP Encrypted Channels Available
          </div>
        </div>
      )}
    </div>
  );
};
