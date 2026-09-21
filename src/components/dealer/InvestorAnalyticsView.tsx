import React, { useState } from 'react';
import { 
  Users, Activity, Lock, Unlock, Phone, Mail, ArrowUpRight, 
  Download, Eye, Filter, CheckCircle2, Flame, Clock, Building2, Search 
} from 'lucide-react';
import { DealerOrganization, DealerProperty } from '@/types/commercial';

interface InvestorAnalyticsViewProps {
  dealer: DealerOrganization | null;
  properties: DealerProperty[];
}

interface InvestorSession {
  id: string;
  investorName: string;
  title: string;
  firmName: string;
  investorType: 'Family Office' | 'Private Equity' | 'Sovereign Wealth' | 'UHNW Principal' | 'REIT';
  targetPropertyTitle: string;
  ndaSigned: boolean;
  timeSpentSeconds: number;
  lastActive: string;
  intentScore: number; // 0 - 100
  topAction: string;
  email: string;
  phone: string;
}

export const InvestorAnalyticsView: React.FC<InvestorAnalyticsViewProps> = ({ dealer, properties }) => {
  // Rich mock investor stream reflecting actual institutional activity
  const [sessions, setSessions] = useState<InvestorSession[]>([
    {
      id: 'inv-1',
      investorName: 'Marcus Vance',
      title: 'Managing Director, Acquisitions',
      firmName: 'Blackstone Real Estate Partners',
      investorType: 'Private Equity',
      targetPropertyTitle: properties[0]?.title || 'Skyline Tower Trophy Mandate',
      ndaSigned: true,
      timeSpentSeconds: 680,
      lastActive: '3 minutes ago',
      intentScore: 97,
      topAction: 'Underwrote 5-Yr Pro-Forma & Downloaded Offering Memo.pdf',
      email: 'm.vance@blackstone.com',
      phone: '+1 (212) 583-5000'
    },
    {
      id: 'inv-2',
      investorName: 'Elena Rostova',
      title: 'Chief Investment Officer',
      firmName: 'Geneva Alpine Multi-Family Office',
      investorType: 'Family Office',
      targetPropertyTitle: properties[1]?.title || properties[0]?.title || 'Villa Bellissima Waterfront',
      ndaSigned: true,
      timeSpentSeconds: 520,
      lastActive: '14 minutes ago',
      intentScore: 92,
      topAction: 'Inspected 3D BIM Floorplates & Executed Digital NDA',
      email: 'elena.rostova@geneva-fo.ch',
      phone: '+41 22 819 0000'
    },
    {
      id: 'inv-3',
      investorName: 'Khalid Al-Mansoor',
      title: 'Head of Global Real Estate',
      firmName: 'Gulf Horizon Sovereign Capital',
      investorType: 'Sovereign Wealth',
      targetPropertyTitle: properties[0]?.title || 'Trophy Commercial Center',
      ndaSigned: true,
      timeSpentSeconds: 840,
      lastActive: '42 minutes ago',
      intentScore: 95,
      topAction: 'Modeled DSCR sensitivity at 60% LTV in Pro-Forma',
      email: 'k.almansoor@gulfhorizon.ae',
      phone: '+971 4 362 7000'
    },
    {
      id: 'inv-4',
      investorName: 'Julian Sterling',
      title: 'Principal Investor',
      firmName: 'Sterling Heritage Trust',
      investorType: 'UHNW Principal',
      targetPropertyTitle: properties[0]?.title || 'Penthouse Crown Sanctuary',
      ndaSigned: false,
      timeSpentSeconds: 210,
      lastActive: '1 hour ago',
      intentScore: 68,
      topAction: 'Viewed 360° Photo Rotunda & Requested Teaser Dossier',
      email: 'j.sterling@sterlingheritage.co.uk',
      phone: '+44 20 7946 0192'
    },
    {
      id: 'inv-5',
      investorName: 'David Chen',
      title: 'VP Capital Markets',
      firmName: 'Starwood Capital Group',
      investorType: 'Private Equity',
      targetPropertyTitle: properties[1]?.title || properties[0]?.title || 'Prime Logistics Hub',
      ndaSigned: true,
      timeSpentSeconds: 610,
      lastActive: '2 hours ago',
      intentScore: 89,
      topAction: 'Downloaded 10-Yr Underwriting Model Excel & CAD BIM Schematics',
      email: 'dchen@starwood.com',
      phone: '+1 (415) 354-2000'
    }
  ]);

  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [contactedInvestor, setContactedInvestor] = useState<string | null>(null);

  const filteredSessions = sessions.filter(s => {
    const matchesFilter = filterType === 'all' 
      ? true 
      : filterType === 'hot' 
      ? s.intentScore >= 90 
      : filterType === 'nda' 
      ? s.ndaSigned 
      : s.investorType.toLowerCase().includes(filterType.toLowerCase());
    
    const matchesSearch = s.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.firmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.targetPropertyTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = 'Investor Name,Firm,Type,Property,NDA Signed,Intent Score,Time Spent (s),Email,Phone\n';
    const rows = sessions.map(s => 
      `"${s.investorName}","${s.firmName}","${s.investorType}","${s.targetPropertyTitle}",${s.ndaSigned},${s.intentScore},${s.timeSpentSeconds},"${s.email}","${s.phone}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Atlas_Investor_DealRoom_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Audit Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Real-Time Deal Room Telemetry & LP Intent Tracking</span>
          </div>
          <h2 className="font-editorial text-3xl text-[#f4f2ec]">Investor Deal-Room Analytics</h2>
          <p className="text-xs text-[#8e8d93] font-light">
            Live behavioral surveillance: track which institutional funds are underwriting your mandates, reviewing floorplates, and signing NDAs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-white/5 hover:bg-white/10 text-xs font-mono-luxury text-[#f4f2ec] border border-white/10 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#c5a880]" />
          <span>Export Compliance Audit (CSV)</span>
        </button>
      </div>

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded bg-[#111116] border border-white/10 space-y-1">
          <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93] flex items-center justify-between">
            <span>Active Reviewers</span>
            <Users className="w-3.5 h-3.5 text-[#c5a880]" />
          </div>
          <div className="font-mono-luxury text-2xl font-bold text-[#f4f2ec]">142 Funds</div>
          <div className="text-[10px] text-emerald-400 font-mono-luxury">↑ 28% this week</div>
        </div>

        <div className="p-5 rounded bg-[#111116] border border-white/10 space-y-1">
          <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93] flex items-center justify-between">
            <span>Executed NDAs</span>
            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-mono-luxury text-2xl font-bold text-emerald-400">38 Executed</div>
          <div className="text-[10px] text-[#8e8d93] font-mono-luxury">26.7% conversion</div>
        </div>

        <div className="p-5 rounded bg-[#111116] border border-white/10 space-y-1">
          <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93] flex items-center justify-between">
            <span>Avg Deal Room Session</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="font-mono-luxury text-2xl font-bold text-[#f4f2ec]">8m 42s</div>
          <div className="text-[10px] text-[#c5a880] font-mono-luxury">High engagement index</div>
        </div>

        <div className="p-5 rounded bg-[#111116] border border-white/10 space-y-1">
          <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93] flex items-center justify-between">
            <span>High-Conviction LPs</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-mono-luxury text-2xl font-bold text-amber-400">19 Qualified</div>
          <div className="text-[10px] text-[#8e8d93] font-mono-luxury">Intent Score &gt; 90</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 rounded bg-[#111116] border border-white/[0.08]">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#8e8d93] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search investor, fund, or asset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-black/40 border border-white/10 text-xs text-[#f4f2ec] focus:outline-none focus:border-[#c5a880]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-mono-luxury">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded transition-colors ${filterType === 'all' ? 'bg-[#c5a880] text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'}`}
          >
            All ({sessions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('hot')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${filterType === 'hot' ? 'bg-amber-400 text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'}`}
          >
            <Flame className="w-3 h-3" />
            <span>High Intent (&gt;90)</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('nda')}
            className={`px-3 py-1 rounded transition-colors ${filterType === 'nda' ? 'bg-emerald-400 text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'}`}
          >
            NDA Signed
          </button>
          <button
            type="button"
            onClick={() => setFilterType('family office')}
            className={`px-3 py-1 rounded transition-colors ${filterType === 'family office' ? 'bg-[#c5a880] text-[#08080a] font-semibold' : 'text-[#8e8d93] hover:text-[#f4f2ec]'}`}
          >
            Family Offices
          </button>
        </div>
      </div>

      {/* Live Investor Sessions Feed */}
      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <div 
            key={session.id}
            className="p-5 rounded-sm bg-[#111116] border border-white/10 hover:border-[#c5a880]/50 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.04] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center font-mono-luxury text-sm font-bold text-[#c5a880]">
                  {session.investorName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-editorial text-lg text-[#f4f2ec]">{session.investorName}</h4>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono-luxury uppercase tracking-wider bg-white/5 border border-white/10 text-[#8e8d93]">
                      {session.investorType}
                    </span>
                    {session.ndaSigned && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono-luxury uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        NDA Executed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#8e8d93]">
                    {session.title} · <strong className="text-[#c5a880] font-normal">{session.firmName}</strong>
                  </div>
                </div>
              </div>

              {/* Intent Score Badge */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="text-right">
                  <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">Lead Intent Score</div>
                  <div className={`font-mono-luxury text-lg font-bold ${
                    session.intentScore >= 90 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {session.intentScore}/100
                  </div>
                </div>

                <div className="h-8 w-px bg-white/10" />

                <div className="text-right">
                  <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">Session Length</div>
                  <div className="font-mono-luxury text-xs text-[#f4f2ec]">
                    {Math.floor(session.timeSpentSeconds / 60)}m {session.timeSpentSeconds % 60}s
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom details & immediate broker action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-[#8e8d93]">
                  Inspecting Mandate: <strong className="text-[#f4f2ec] font-normal">{session.targetPropertyTitle}</strong>
                </div>
                <div className="text-[11px] text-[#c5a880] font-mono-luxury flex items-center gap-1.5">
                  <Activity className="w-3 h-3" />
                  <span>Activity: {session.topAction} ({session.lastActive})</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <a
                  href={`tel:${session.phone}`}
                  onClick={() => setContactedInvestor(session.id)}
                  className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs font-mono-luxury text-[#f4f2ec] border border-white/10 flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>Call Principal</span>
                </a>

                <a
                  href={`mailto:${session.email}?subject=Follow-up:%20Atlas%20Deal%20Room%20-%20${encodeURIComponent(session.targetPropertyTitle)}`}
                  onClick={() => setContactedInvestor(session.id)}
                  className="px-3 py-1.5 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] text-xs font-mono-luxury font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <Mail className="w-3 h-3" />
                  <span>Direct Outreach</span>
                </a>
              </div>
            </div>

            {contactedInvestor === session.id && (
              <div className="text-[10px] font-mono-luxury text-emerald-400 flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Broker outreach logged in CRM trail</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
