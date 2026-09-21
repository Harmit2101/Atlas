import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  fetchDealers, 
  fetchDealerProperties, 
  createDealerProperty, 
  fetchLeadAssignments, 
  updateLeadAssignmentStatus 
} from '@/services/dealerService';
import { fetchInquiries } from '@/services/commercialService';
import { DealerOrganization, DealerProperty, LeadAssignment, Inquiry } from '@/types/commercial';
import { InvestorAnalyticsView } from '@/components/dealer/InvestorAnalyticsView';
import { WhiteLabelSuiteView } from '@/components/dealer/WhiteLabelSuiteView';
import { 
  Building, Plus, Home, Users, Check, X, 
  Phone, Mail, Calendar, Loader2, ArrowUpRight, Lock, Eye, Activity, Sparkles
} from 'lucide-react';

export const DealerDashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'leads' | 'analytics' | 'whitelabel' | 'add_property'>('overview');
  const [dealers, setDealers] = useState<DealerOrganization[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<DealerOrganization | null>(null);
  const [properties, setProperties] = useState<DealerProperty[]>([]);
  const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // New property form
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [newProp, setNewProp] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    propertyType: 'villa',
    bedrooms: '4',
    bathrooms: '4',
    areaSqm: '450',
    country: 'United Arab Emirates',
    city: 'Dubai',
    address: 'Palm Jumeirah',
    images: '',
    visibility: 'public' as DealerProperty['visibility']
  });

  useEffect(() => {
    loadDealerData();
  }, []);

  async function loadDealerData() {
    setLoading(true);
    const orgs = await fetchDealers();
    setDealers(orgs);
    if (orgs.length > 0) {
      const active = orgs[0];
      setSelectedDealer(active);
      const [props, assigns, allInqs] = await Promise.all([
        fetchDealerProperties(active.id),
        fetchLeadAssignments(active.id),
        fetchInquiries({ assignedDealerId: active.id })
      ]);
      setProperties(props);
      setAssignments(assigns);
      setInquiries(allInqs);
    }
    setLoading(false);
  }

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealer) return;
    setFormSubmitting(true);
    const imageUrls = newProp.images
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    await createDealerProperty({
      dealer_id: selectedDealer.id,
      title: newProp.title,
      description: newProp.description,
      price: Number(newProp.price),
      currency: newProp.currency,
      transaction_type: 'sale',
      property_type: newProp.propertyType,
      bedrooms: Number(newProp.bedrooms),
      bathrooms: Number(newProp.bathrooms),
      area_sqm: Number(newProp.areaSqm),
      country: newProp.country,
      city: newProp.city,
      address: newProp.address,
      latitude: 25.1124,
      longitude: 55.1390,
      images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80'],
      features: ['Private Beachfront Access', 'Smart Home Automation', 'Infinity Pool'],
      visibility: newProp.visibility,
      availability_status: 'available'
    });

    setFormSubmitting(false);
    setFormSuccess(true);
    const updatedProps = await fetchDealerProperties(selectedDealer.id);
    setProperties(updatedProps);
    setTimeout(() => {
      setFormSuccess(false);
      setActiveTab('properties');
    }, 1200);
  };

  const handleLeadAction = async (assignmentId: string, status: 'accepted' | 'rejected') => {
    await updateLeadAssignmentStatus(assignmentId, status);
    if (selectedDealer) {
      const assigns = await fetchLeadAssignments(selectedDealer.id);
      setAssignments(assigns);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-mono-luxury text-xs text-[#8e8d93]">
        Verifying Partner Broker Credentials...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
            <Building className="w-3.5 h-3.5" />
            <span>PARTNER DEALER CONSOLE · {selectedDealer?.name || 'Authorized Agency'}</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#f4f2ec] mt-1">Agency Management Portal</h1>
        </div>

        {selectedDealer && (
          <div className="flex items-center gap-3">
            <a
              href={`/agency/${selectedDealer.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs font-mono-luxury text-[#f4f2ec] border border-white/10"
            >
              <span>Public Storefront</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#c5a880]" />
            </a>
            <button
              onClick={() => setActiveTab('add_property')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] text-xs font-mono-luxury font-semibold uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>List Mandate</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/[0.06] pb-3 text-xs font-mono-luxury uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'overview' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          Agency Overview
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'properties' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          Direct Inventory ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'leads' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          Assigned Inquiries ({inquiries.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'analytics' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>Deal-Room Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('whitelabel')}
          className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'whitelabel' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          <Sparkles className="w-3 h-3 text-[#c5a880]" />
          <span>White-Label Suite</span>
        </button>
        <button
          onClick={() => setActiveTab('add_property')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'add_property' ? 'border-[#c5a880] text-[#c5a880] font-semibold' : 'border-transparent text-[#8e8d93] hover:text-[#f4f2ec]'
          }`}
        >
          + Add Direct Mandate
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-[#111116] border border-white/10 rounded">
              <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]">Active Mandates</span>
              <div className="font-editorial text-3xl text-[#f4f2ec] mt-2">{properties.length}</div>
              <span className="text-[11px] text-[#c5a880] font-mono-luxury mt-1 block">Live on Global Showcase</span>
            </div>
            <div className="p-6 bg-[#111116] border border-white/10 rounded">
              <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]">Assigned Leads</span>
              <div className="font-editorial text-3xl text-[#f4f2ec] mt-2">{inquiries.length}</div>
              <span className="text-[11px] text-emerald-400 font-mono-luxury mt-1 block">Atlas Concierge Qualified</span>
            </div>
            <div className="p-6 bg-[#111116] border border-white/10 rounded">
              <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]">Agency Clearance</span>
              <div className="font-editorial text-3xl text-[#c5a880] mt-2">Verified</div>
              <span className="text-[11px] text-[#8e8d93] font-mono-luxury mt-1 block">Founding Partner Tier</span>
            </div>
          </div>

          <div className="p-6 bg-[#111116] border border-white/10 rounded space-y-4">
            <h3 className="font-editorial text-2xl text-[#f4f2ec]">Atlas Founding Partner Privileges</h3>
            <p className="text-xs text-[#8e8d93] leading-relaxed font-light">
              As a verified agency, your direct mandates bypass third-party syndication delays and are rendered with highest priority on the interactive 3D Globe and Explore grid. Your agency profile is permanently attributed across all your listings.
            </p>
          </div>
        </div>
      )}

      {/* PROPERTIES TAB */}
      {activeTab === 'properties' && (
        <div className="bg-[#111116] border border-white/10 rounded overflow-hidden">
          {properties.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8e8d93] font-mono-luxury space-y-4">
              <p>No direct properties added yet for this agency.</p>
              <button
                onClick={() => setActiveTab('add_property')}
                className="px-4 py-2 rounded bg-[#c5a880] text-[#08080a] font-semibold text-xs"
              >
                Create Your First Mandate
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] text-xs">
              {properties.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt="" className="w-16 h-12 rounded object-cover border border-white/10" />
                    ) : (
                      <div className="w-16 h-12 rounded bg-black/50 border border-white/10" />
                    )}
                    <div>
                      <h4 className="font-semibold text-[#f4f2ec] text-sm">{p.title}</h4>
                      <p className="text-[#8e8d93] text-xs font-mono-luxury">
                        ${p.price.toLocaleString()} · {p.bedrooms} Beds · {p.area_sqm} m² · {p.city}, {p.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono-luxury uppercase">
                      {p.availability_status}
                    </span>
                    <a
                      href={`/property/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#c5a880] hover:underline flex items-center gap-1"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LEADS TAB */}
      {activeTab === 'leads' && (
        <div className="bg-[#111116] border border-white/10 rounded overflow-hidden">
          {inquiries.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8e8d93] font-mono-luxury">
              No inquiries routed to this agency yet. As buyers submit mandates on your listings, they will appear here.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] text-xs">
              {inquiries.map(inq => (
                <div key={inq.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[#f4f2ec] text-sm">{inq.full_name}</h4>
                      <p className="text-[#8e8d93] text-xs">
                        Target Asset: {inq.property_title || inq.property_id}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#c5a880]/20 text-[#c5a880] text-[10px] font-mono-luxury uppercase font-semibold">
                      {inq.status}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-black/40 border border-white/5 text-xs text-[#f4f2ec]">
                    "{inq.message}"
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-[11px] font-mono-luxury text-[#8e8d93]">
                    <div className="flex items-center gap-4">
                      <span>Email: {inq.email}</span>
                      {inq.phone && <span>Tel: {inq.phone}</span>}
                      <span>Timeline: {inq.purchase_timeline?.replace(/_/g, ' ') || '30 days'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD DIRECT MANDATE FORM */}
      {activeTab === 'add_property' && (
        <div className="bg-[#111116] border border-white/10 rounded p-6 sm:p-8 max-w-3xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
              EXCLUSIVE DIRECT INVENTORY
            </span>
            <h3 className="font-editorial text-2xl text-[#f4f2ec]">List New Property Mandate</h3>
            <p className="text-xs text-[#8e8d93] mt-1">
              Add authentic agency-represented properties. This listing will render on the Atlas Globe and in your Agency Storefront.
            </p>
          </div>

          {formSuccess ? (
            <div className="py-12 text-center space-y-3">
              <Check className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-editorial text-xl text-[#f4f2ec]">Mandate Published Successfully</h4>
              <p className="text-xs text-[#8e8d93]">Redirecting to agency portfolio...</p>
            </div>
          ) : (
            <form onSubmit={handleCreateProperty} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                  Property Title *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. The Frond G Signature Beachfront Villa"
                  value={newProp.title}
                  onChange={e => setNewProp({ ...newProp, title: e.target.value })}
                  className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none focus:border-[#c5a880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Price (USD) *
                  </label>
                  <input
                    required
                    type="number"
                    placeholder="12500000"
                    value={newProp.price}
                    onChange={e => setNewProp({ ...newProp, price: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Property Type
                  </label>
                  <select
                    value={newProp.propertyType}
                    onChange={e => setNewProp({ ...newProp, propertyType: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-2.5 py-2 text-[#f4f2ec] outline-none"
                  >
                    <option value="villa">Villa / Estate</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="mansion">Mansion</option>
                    <option value="chalet">Alpine Chalet</option>
                    <option value="island">Private Island</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={newProp.bedrooms}
                    onChange={e => setNewProp({ ...newProp, bedrooms: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={newProp.bathrooms}
                    onChange={e => setNewProp({ ...newProp, bathrooms: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Area (m²)
                  </label>
                  <input
                    type="number"
                    value={newProp.areaSqm}
                    onChange={e => setNewProp({ ...newProp, areaSqm: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    Country *
                  </label>
                  <input
                    required
                    type="text"
                    value={newProp.country}
                    onChange={e => setNewProp({ ...newProp, country: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                    City *
                  </label>
                  <input
                    required
                    type="text"
                    value={newProp.city}
                    onChange={e => setNewProp({ ...newProp, city: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                  Architectural Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Comprehensive description of provenance, finishes, views..."
                  value={newProp.description}
                  onChange={e => setNewProp({ ...newProp, description: e.target.value })}
                  className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                  Image URLs (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="https://.../photo1.jpg&#10;https://.../photo2.jpg"
                  value={newProp.images}
                  onChange={e => setNewProp({ ...newProp, images: e.target.value })}
                  className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2 text-[#f4f2ec] outline-none resize-none font-mono text-[11px]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-3 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold flex items-center gap-2"
                >
                  {formSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Publish Mandate to Global Network</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* DEAL-ROOM ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <InvestorAnalyticsView 
          dealer={selectedDealer} 
          properties={properties} 
        />
      )}

      {/* WHITE-LABEL SUITE TAB */}
      {activeTab === 'whitelabel' && (
        <WhiteLabelSuiteView 
          dealer={selectedDealer} 
        />
      )}
    </div>
  );
};
