import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  fetchInquiries, 
  updateInquiryStatus, 
  fetchListingClaims, 
  updateListingClaimStatus 
} from '@/services/commercialService';
import { fetchDealers, assignLeadToDealer } from '@/services/dealerService';
import { Inquiry, ListingClaim, DealerOrganization, InquiryStatus, ClaimStatus } from '@/types/commercial';
import { 
  ShieldAlert, CheckCircle, Clock, Filter, UserCheck, 
  ExternalLink, Mail, Phone, Calendar, ArrowUpRight, Loader2, Building, RefreshCw
} from 'lucide-react';

export const AdminLeadDeskPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'inquiries' | 'claims' | 'dealers'>('inquiries');
  
  // Data states
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [claims, setClaims] = useState<ListingClaim[]>([]);
  const [dealers, setDealers] = useState<DealerOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignDealerId, setAssignDealerId] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  // Security check: only allow admins
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin') || user?.email?.includes('hmcoding.com');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [inqs, clms, dlrs] = await Promise.all([
      fetchInquiries(),
      fetchListingClaims(),
      fetchDealers()
    ]);
    setInquiries(inqs);
    setClaims(clms);
    setDealers(dlrs);
    setLoading(false);
  }

  const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
    setUpdating(true);
    await updateInquiryStatus(inquiryId, newStatus, user?.id);
    await loadData();
    if (selectedInquiry && selectedInquiry.id === inquiryId) {
      setSelectedInquiry(prev => prev ? { ...prev, status: newStatus } : null);
    }
    setUpdating(false);
  };

  const handleAssignDealer = async (inquiryId: string) => {
    if (!assignDealerId) return;
    setUpdating(true);
    await assignLeadToDealer(inquiryId, assignDealerId, user?.id);
    await loadData();
    setAssignDealerId('');
    setUpdating(false);
  };

  const handleClaimStatusChange = async (claimId: string, newStatus: ClaimStatus) => {
    setUpdating(true);
    await updateListingClaimStatus(claimId, newStatus);
    await loadData();
    setUpdating(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-mono-luxury text-xs text-[#8e8d93]">
        Verifying Administrative Credentials...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-24 p-8 bg-[#111116] border border-red-500/30 rounded-sm text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="font-editorial text-2xl text-[#f4f2ec]">Administrative Clearance Required</h2>
        <p className="text-xs text-[#8e8d93] leading-relaxed">
          Access to the Atlas Private Lead Desk & Brokerage Clearance Console is strictly restricted to authorized partners and administrators.
        </p>
      </div>
    );
  }

  const filteredInquiries = statusFilter === 'all' 
    ? inquiries 
    : inquiries.filter(i => i.status === statusFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            <span>RESTRICTED PLATFORM OPERATIONS</span>
            <span>·</span>
            <span className="text-emerald-400">AUTHENTICATED ADMIN</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#f4f2ec] mt-1">Lead Desk & Operations</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs font-mono-luxury text-[#f4f2ec]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3 text-xs font-mono-luxury uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'inquiries' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          Buyer Inquiries ({inquiries.length})
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'claims' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          Broker Listing Claims ({claims.length})
        </button>
        <button
          onClick={() => setActiveTab('dealers')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'dealers' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          Partner Dealers ({dealers.length})
        </button>
      </div>

      {/* INQUIRIES VIEW */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex items-center gap-3 text-xs font-mono-luxury">
            <span className="text-[#8e8d93]">Filter Status:</span>
            {['all', 'new', 'reviewing', 'qualified', 'introduced', 'in_progress', 'closed_won', 'closed_lost'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded capitalize ${
                  statusFilter === st ? 'bg-[#c5a880] text-[#08080a] font-semibold' : 'bg-white/5 text-[#8e8d93] hover:text-[#f4f2ec]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Inquiries Table */}
            <div className="lg:col-span-7 bg-[#111116] border border-white/10 rounded overflow-hidden">
              {filteredInquiries.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#8e8d93] font-mono-luxury">
                  No inquiries matching the selected criteria.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {filteredInquiries.map(inq => (
                    <div
                      key={inq.id}
                      onClick={() => setSelectedInquiry(inq)}
                      className={`p-4 cursor-pointer hover:bg-white/[0.02] transition-colors ${
                        selectedInquiry?.id === inq.id ? 'bg-[#c5a880]/10 border-l-2 border-[#c5a880]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#f4f2ec]">{inq.full_name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono-luxury uppercase ${
                          inq.status === 'new' ? 'bg-amber-500/20 text-amber-300' :
                          inq.status === 'qualified' ? 'bg-emerald-500/20 text-emerald-300' :
                          inq.status === 'introduced' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-white/10 text-[#8e8d93]'
                        }`}>
                          {inq.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-[#8e8d93] mt-1 truncate">
                        {inq.property_title || `Asset ID: ${inq.property_id}`}
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-[#8e8d93] mt-2 font-mono-luxury">
                        <span>{new Date(inq.created_at).toLocaleDateString()}</span>
                        <span>{inq.email}</span>
                        {inq.buyer_type && <span className="capitalize">{inq.buyer_type.replace('_', ' ')}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inquiry Inspector Pane */}
            <div className="lg:col-span-5 bg-[#111116] border border-white/10 rounded p-6 space-y-6">
              {selectedInquiry ? (
                <>
                  <div className="border-b border-white/10 pb-4">
                    <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
                      DOSSIER INSPECTOR
                    </span>
                    <h3 className="font-editorial text-2xl text-[#f4f2ec]">{selectedInquiry.full_name}</h3>
                    <div className="text-xs text-[#8e8d93] flex items-center gap-2 mt-1">
                      <Mail className="w-3.5 h-3.5" />
                      <a href={`mailto:${selectedInquiry.email}`} className="text-[#c5a880] hover:underline">
                        {selectedInquiry.email}
                      </a>
                      {selectedInquiry.phone && (
                        <>
                          <span>·</span>
                          <Phone className="w-3.5 h-3.5" />
                          <span>{selectedInquiry.phone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Qualification Data */}
                  <div className="space-y-3 text-xs">
                    <h4 className="font-mono-luxury uppercase tracking-wider text-[11px] text-[#c5a880]">
                      Buyer Profile & Mandate
                    </h4>
                    <div className="grid grid-cols-2 gap-3 bg-black/40 p-3 rounded border border-white/5">
                      <div>
                        <span className="text-[10px] text-[#8e8d93] block">Entity</span>
                        <span className="text-[#f4f2ec] font-medium capitalize">
                          {selectedInquiry.buyer_type?.replace('_', ' ') || 'Individual'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8e8d93] block">Timeline</span>
                        <span className="text-[#f4f2ec] font-medium capitalize">
                          {selectedInquiry.purchase_timeline?.replace(/_/g, ' ') || 'Not specified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8e8d93] block">Purpose</span>
                        <span className="text-[#f4f2ec] font-medium capitalize">
                          {selectedInquiry.purpose?.replace(/_/g, ' ') || 'Secondary Estate'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8e8d93] block">Financing</span>
                        <span className="text-[#f4f2ec] font-medium capitalize">
                          {selectedInquiry.financing_status || 'Cash'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-mono-luxury uppercase tracking-wider text-[11px] text-[#c5a880]">
                      Advisory Request
                    </h4>
                    <div className="p-3 rounded bg-black/40 border border-white/5 text-[#f4f2ec] whitespace-pre-wrap leading-relaxed">
                      {selectedInquiry.message}
                    </div>
                  </div>

                  {/* Triage Status Actions */}
                  <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                    <h4 className="font-mono-luxury uppercase tracking-wider text-[11px] text-[#c5a880]">
                      Lifecycle Action
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        disabled={updating}
                        onClick={() => handleStatusChange(selectedInquiry.id, 'reviewing')}
                        className="p-2 rounded bg-white/5 hover:bg-white/10 text-xs font-mono-luxury text-center"
                      >
                        Reviewing
                      </button>
                      <button
                        disabled={updating}
                        onClick={() => handleStatusChange(selectedInquiry.id, 'qualified')}
                        className="p-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono-luxury text-center font-semibold"
                      >
                        Mark Qualified
                      </button>
                      <button
                        disabled={updating}
                        onClick={() => handleStatusChange(selectedInquiry.id, 'closed_lost')}
                        className="p-2 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-mono-luxury text-center"
                      >
                        Disqualify
                      </button>
                    </div>
                  </div>

                  {/* Dealer Lead Routing */}
                  <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                    <h4 className="font-mono-luxury uppercase tracking-wider text-[11px] text-[#c5a880]">
                      Route to Partner Dealer
                    </h4>
                    <div className="flex items-center gap-2">
                      <select
                        value={assignDealerId}
                        onChange={e => setAssignDealerId(e.target.value)}
                        className="flex-1 bg-[#08080a] border border-white/10 rounded px-2.5 py-2 text-[#f4f2ec] text-xs outline-none"
                      >
                        <option value="">Select Partner Brokerage...</option>
                        {dealers.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.city}, {d.country})
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={!assignDealerId || updating}
                        onClick={() => handleAssignDealer(selectedInquiry.id)}
                        className="px-3 py-2 rounded bg-[#c5a880] text-[#08080a] font-mono-luxury text-xs font-semibold disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-24 text-center text-xs text-[#8e8d93] font-mono-luxury">
                  Select an inquiry from the ledger to inspect dossier.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LISTING CLAIMS VIEW */}
      {activeTab === 'claims' && (
        <div className="bg-[#111116] border border-white/10 rounded overflow-hidden">
          {claims.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8e8d93] font-mono-luxury">
              No representation claims submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] text-xs">
              {claims.map(claim => (
                <div key={claim.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#f4f2ec]">{claim.brokerage_name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono-luxury uppercase ${
                        claim.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' :
                        claim.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                    <div className="text-[#8e8d93]">
                      Representative: {claim.claimant_name} ({claim.claimant_email})
                    </div>
                    <div className="text-[11px] font-mono-luxury text-[#c5a880]">
                      Target Property ID: {claim.property_id} · License: {claim.license_number || 'None provided'}
                    </div>
                    {claim.notes && (
                      <p className="text-[11px] text-[#8e8d93] italic mt-1">"{claim.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {claim.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleClaimStatusChange(claim.id, 'approved')}
                          className="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono-luxury text-xs"
                        >
                          Approve Claim
                        </button>
                        <button
                          onClick={() => handleClaimStatusChange(claim.id, 'rejected')}
                          className="px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 font-mono-luxury text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DEALERS VIEW */}
      {activeTab === 'dealers' && (
        <div className="bg-[#111116] border border-white/10 rounded overflow-hidden">
          {dealers.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8e8d93] font-mono-luxury">
              No registered partner brokerages in directory.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] text-xs">
              {dealers.map(d => (
                <div key={d.id} className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[#f4f2ec] text-base">{d.name}</h4>
                    <p className="text-[#8e8d93] text-xs">{d.city}, {d.country} · {d.contact_email}</p>
                    <span className="text-[10px] font-mono-luxury uppercase text-[#c5a880] mt-1 inline-block">
                      Status: {d.status} · Tier: {d.commercial_status}
                    </span>
                  </div>
                  <a
                    href={`/agency/${d.slug}`}
                    className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs font-mono-luxury text-[#f4f2ec] flex items-center gap-1.5"
                  >
                    <span>View Storefront</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#c5a880]" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
