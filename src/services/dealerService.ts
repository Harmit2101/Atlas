import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getCloudAvailability } from '@/services/authService';
import { 
  DealerOrganization, 
  DealerMember, 
  DealerProperty, 
  BuyerPreferences,
  LeadAssignment,
  Opportunity,
  DealerAgreement,
  Referral,
  CommissionRecord,
  PropertyAccessRequest
} from '@/types/commercial';
import { AtlasProperty } from '@/types/property';

const isCloudActive = () => isSupabaseConfigured && getCloudAvailability();

const LOCAL_DEALERS_KEY = 'atlas_local_dealer_orgs';
const LOCAL_DEALER_PROPERTIES_KEY = 'atlas_local_dealer_properties';
const LOCAL_PREFERENCES_KEY = 'atlas_local_buyer_preferences';
const LOCAL_LEAD_ASSIGNMENTS_KEY = 'atlas_local_lead_assignments';
const LOCAL_OPPORTUNITIES_KEY = 'atlas_local_opportunities';
const LOCAL_REFERRALS_KEY = 'atlas_local_referrals';
const LOCAL_AGREEMENTS_KEY = 'atlas_local_agreements';
const LOCAL_COMMISSIONS_KEY = 'atlas_local_commissions';
const LOCAL_ACCESS_REQUESTS_KEY = 'atlas_local_access_requests';

function readStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

// -------------------------------------------------------------
// DEALER ORGANIZATIONS
// -------------------------------------------------------------
export async function fetchDealers(filter?: { status?: DealerOrganization['status'] }): Promise<DealerOrganization[]> {
  if (isCloudActive()) {
    try {
      let q = supabase.from('dealer_organizations').select('*').order('name');
      if (filter?.status) q = q.eq('status', filter.status);
      const { data, error } = await q;
      if (!error && data) return data as DealerOrganization[];
    } catch (e) {
      console.warn('[ATLAS] Error fetching dealers from Supabase:', e);
    }
  }
  let local = readStorage<DealerOrganization>(LOCAL_DEALERS_KEY);
  if (filter?.status) local = local.filter(d => d.status === filter.status);
  return local;
}

export async function fetchDealerBySlug(slug: string): Promise<DealerOrganization | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('dealer_organizations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!error && data) return data as DealerOrganization;
    } catch (e) {
      console.warn('[ATLAS] Error fetching dealer by slug:', e);
    }
  }
  const local = readStorage<DealerOrganization>(LOCAL_DEALERS_KEY);
  return local.find(d => d.slug === slug) || null;
}

export async function createDealerOrganization(input: {
  name: string;
  slug: string;
  country: string;
  city: string;
  contactEmail: string;
  phone?: string;
  website?: string;
  description?: string;
}): Promise<{ data: DealerOrganization | null; error: string | null }> {
  const org: DealerOrganization = {
    id: crypto.randomUUID ? crypto.randomUUID() : 'org-' + Math.random().toString(36).substring(2, 9),
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    country: input.country.trim(),
    city: input.city.trim(),
    contact_email: input.contactEmail.trim().toLowerCase(),
    phone: input.phone?.trim(),
    website: input.website?.trim(),
    description: input.description?.trim(),
    status: 'pending',
    commercial_status: 'trial',
    pricing_plan: 'founding_partner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isCloudActive()) {
    try {
      const { data, error } = await supabase.from('dealer_organizations').insert([org]).select().single();
      if (!error && data) return { data: data as DealerOrganization, error: null };
      if (error) return { data: null, error: error.message };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  }

  const list = readStorage<DealerOrganization>(LOCAL_DEALERS_KEY);
  list.push(org);
  writeStorage(LOCAL_DEALERS_KEY, list);
  return { data: org, error: null };
}

export async function updateDealerStatus(
  id: string, 
  status: DealerOrganization['status'], 
  commercialStatus?: DealerOrganization['commercial_status']
): Promise<{ success: boolean }> {
  if (isCloudActive()) {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (commercialStatus) updateData.commercial_status = commercialStatus;
      const { error } = await supabase.from('dealer_organizations').update(updateData).eq('id', id);
      if (!error) return { success: true };
    } catch {}
  }
  const list = readStorage<DealerOrganization>(LOCAL_DEALERS_KEY);
  const idx = list.findIndex(d => d.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    if (commercialStatus) list[idx].commercial_status = commercialStatus;
    list[idx].updated_at = new Date().toISOString();
    writeStorage(LOCAL_DEALERS_KEY, list);
    return { success: true };
  }
  return { success: false };
}

// -------------------------------------------------------------
// DIRECT DEALER PROPERTIES
// -------------------------------------------------------------
export async function fetchDealerProperties(dealerId?: string): Promise<DealerProperty[]> {
  if (isCloudActive()) {
    try {
      let q = supabase.from('dealer_properties').select('*').order('created_at', { ascending: false });
      if (dealerId) q = q.eq('dealer_id', dealerId);
      const { data, error } = await q;
      if (!error && data) return data as DealerProperty[];
    } catch {}
  }
  let local = readStorage<DealerProperty>(LOCAL_DEALER_PROPERTIES_KEY);
  if (dealerId) local = local.filter(p => p.dealer_id === dealerId);
  return local;
}

export async function createDealerProperty(property: Omit<DealerProperty, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: DealerProperty | null; error: string | null }> {
  const newProp: DealerProperty = {
    ...property,
    id: crypto.randomUUID ? crypto.randomUUID() : 'dp-' + Math.random().toString(36).substring(2, 9),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isCloudActive()) {
    try {
      const { data, error } = await supabase.from('dealer_properties').insert([newProp]).select().single();
      if (!error && data) return { data: data as DealerProperty, error: null };
      if (error) return { data: null, error: error.message };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  }

  const list = readStorage<DealerProperty>(LOCAL_DEALER_PROPERTIES_KEY);
  list.unshift(newProp);
  writeStorage(LOCAL_DEALER_PROPERTIES_KEY, list);
  return { data: newProp, error: null };
}

// Convert a DealerProperty into the normalized AtlasProperty representation
export function convertDealerPropertyToAtlas(dp: DealerProperty, dealerName?: string): AtlasProperty {
  return {
    id: dp.id,
    sourceId: dp.id,
    sourceName: dealerName || 'Partner Agency',
    sourceUrl: '',
    title: dp.title,
    subtitle: dp.subtype || dp.property_type,
    description: dp.description,
    price: dp.price,
    priceFormatted: `$${dp.price.toLocaleString()}`,
    priceUsd: dp.price,
    currency: dp.currency,
    country: dp.country,
    city: dp.city,
    displayLocation: `${dp.city}, ${dp.country}`,
    latitude: dp.latitude,
    longitude: dp.longitude,
    propertyType: dp.property_type,
    transactionType: dp.transaction_type,
    bedrooms: dp.bedrooms,
    bathrooms: dp.bathrooms,
    areaSqm: dp.area_sqm,
    areaSqft: dp.area_sqft || Math.round(dp.area_sqm * 10.7639),
    yearBuilt: dp.year_built,
    architecturalStyle: dp.architectural_style,
    images: dp.images,
    imageUrl: dp.images[0] || '',
    features: dp.features,
    curatorNotes: `Direct Partner Mandate via ${dealerName || 'Exclusive Dealer Network'}.`,
    isLive: true,
    status: dp.availability_status,
    featured: true,
    listingIntent: dp.transaction_type === 'rent' ? 'rent' : 'sale',
    rentalPeriod: dp.transaction_type === 'rent' ? 'month' : undefined,
    isHighValueSale: dp.transaction_type === 'sale' && dp.price >= 300000,
    isUltraLuxuryRental: false,
    floorPlans: []
  };
}

// -------------------------------------------------------------
// BUYER PREFERENCES & MATCHING ENGINE (Deterministic, Zero AI)
// -------------------------------------------------------------
export async function getBuyerPreferences(userId: string): Promise<BuyerPreferences | null> {
  if (isCloudActive()) {
    try {
      const { data, error } = await supabase
        .from('buyer_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) return data as BuyerPreferences;
    } catch {}
  }
  const all = readStorage<BuyerPreferences>(LOCAL_PREFERENCES_KEY);
  return all.find(p => p.user_id === userId) || null;
}

export async function saveBuyerPreferences(prefs: Omit<BuyerPreferences, 'id' | 'updated_at'>): Promise<{ success: boolean }> {
  const updated: BuyerPreferences = {
    ...prefs,
    id: crypto.randomUUID ? crypto.randomUUID() : 'bp-' + Math.random().toString(36).substring(2, 9),
    updated_at: new Date().toISOString()
  };

  if (isCloudActive()) {
    try {
      const { error } = await supabase
        .from('buyer_preferences')
        .upsert(updated, { onConflict: 'user_id' });
      if (!error) return { success: true };
    } catch {}
  }

  const list = readStorage<BuyerPreferences>(LOCAL_PREFERENCES_KEY);
  const idx = list.findIndex(p => p.user_id === prefs.user_id);
  if (idx !== -1) {
    list[idx] = updated;
  } else {
    list.push(updated);
  }
  writeStorage(LOCAL_PREFERENCES_KEY, list);
  return { success: true };
}

export interface PropertyMatchResult {
  property: AtlasProperty;
  matchScore: number; // 0 to 100
  matchTier: 'Strong Match' | 'Potential Match' | 'Outside Preferences';
  reasons: string[];
}

export function evaluatePropertyMatch(property: AtlasProperty, prefs: BuyerPreferences): PropertyMatchResult {
  const reasons: string[] = [];
  let score = 0;

  // Location check
  if (prefs.preferred_markets && prefs.preferred_markets.length > 0) {
    const locString = `${property.country} ${property.city} ${property.displayLocation || ''}`.toLowerCase();
    const matchesLoc = prefs.preferred_markets.some(m => locString.includes(m.toLowerCase()));
    if (matchesLoc) {
      score += 40;
      reasons.push(`Located in preferred market (${property.city}, ${property.country})`);
    }
  } else {
    score += 20; // no constraint
  }

  // Budget check
  const propPrice = property.priceUsd || property.price;
  if (prefs.budget_min && prefs.budget_max) {
    if (propPrice >= prefs.budget_min && propPrice <= prefs.budget_max) {
      score += 30;
      reasons.push(`Price ($${propPrice.toLocaleString()}) within target budget`);
    } else if (propPrice <= prefs.budget_max * 1.15) {
      score += 15;
      reasons.push(`Price slightly above target budget (+15%)`);
    }
  } else if (prefs.budget_max && propPrice <= prefs.budget_max) {
    score += 30;
    reasons.push(`Under maximum budget ($${prefs.budget_max.toLocaleString()})`);
  } else {
    score += 15;
  }

  // Bedroom check
  if (prefs.min_bedrooms) {
    if (property.bedrooms >= prefs.min_bedrooms) {
      score += 15;
      reasons.push(`Meets bedroom requirement (${property.bedrooms} beds, min ${prefs.min_bedrooms})`);
    }
  } else {
    score += 10;
  }

  // Property Type check
  if (prefs.property_types && prefs.property_types.length > 0) {
    const matchesType = prefs.property_types.some(t => 
      property.propertyType.toLowerCase().includes(t.toLowerCase())
    );
    if (matchesType) {
      score += 15;
      reasons.push(`Matches desired architectural classification (${property.propertyType})`);
    }
  } else {
    score += 10;
  }

  let matchTier: PropertyMatchResult['matchTier'] = 'Outside Preferences';
  if (score >= 75) {
    matchTier = 'Strong Match';
  } else if (score >= 45) {
    matchTier = 'Potential Match';
  }

  if (reasons.length === 0) {
    reasons.push('Insufficient listing criteria to confirm preference alignment');
  }

  return {
    property,
    matchScore: Math.min(100, score),
    matchTier,
    reasons
  };
}

// -------------------------------------------------------------
// LEAD ROUTING & ASSIGNMENTS
// -------------------------------------------------------------
export async function assignLeadToDealer(
  inquiryId: string, 
  dealerId: string, 
  assignedBy?: string
): Promise<{ success: boolean; error?: string }> {
  const assignment: LeadAssignment = {
    id: crypto.randomUUID ? crypto.randomUUID() : 'la-' + Math.random().toString(36).substring(2, 9),
    inquiry_id: inquiryId,
    dealer_id: dealerId,
    assigned_by: assignedBy,
    status: 'pending',
    assigned_at: new Date().toISOString()
  };

  if (isCloudActive()) {
    try {
      const { error } = await supabase.from('lead_assignments').insert([assignment]);
      if (!error) {
        // Also update assigned_dealer_id on the inquiry
        await supabase
          .from('inquiries')
          .update({ assigned_dealer_id: dealerId, status: 'introduced' })
          .eq('id', inquiryId);
        return { success: true };
      }
    } catch (e: any) {
      console.warn('[ATLAS] Error assigning lead in Supabase:', e);
    }
  }

  const list = readStorage<LeadAssignment>(LOCAL_LEAD_ASSIGNMENTS_KEY);
  list.unshift(assignment);
  writeStorage(LOCAL_LEAD_ASSIGNMENTS_KEY, list);
  return { success: true };
}

export async function fetchLeadAssignments(dealerId?: string): Promise<LeadAssignment[]> {
  if (isCloudActive()) {
    try {
      let q = supabase.from('lead_assignments').select('*').order('assigned_at', { ascending: false });
      if (dealerId) q = q.eq('dealer_id', dealerId);
      const { data, error } = await q;
      if (!error && data) return data as LeadAssignment[];
    } catch {}
  }
  let local = readStorage<LeadAssignment>(LOCAL_LEAD_ASSIGNMENTS_KEY);
  if (dealerId) local = local.filter(a => a.dealer_id === dealerId);
  return local;
}

export async function updateLeadAssignmentStatus(
  id: string, 
  status: LeadAssignment['status']
): Promise<{ success: boolean }> {
  const updatePayload: any = { status };
  if (status === 'accepted') updatePayload.accepted_at = new Date().toISOString();
  if (status === 'rejected') updatePayload.rejected_at = new Date().toISOString();

  if (isCloudActive()) {
    try {
      const { error } = await supabase.from('lead_assignments').update(updatePayload).eq('id', id);
      if (!error) return { success: true };
    } catch {}
  }

  const list = readStorage<LeadAssignment>(LOCAL_LEAD_ASSIGNMENTS_KEY);
  const idx = list.findIndex(a => a.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    if (status === 'accepted') list[idx].accepted_at = new Date().toISOString();
    if (status === 'rejected') list[idx].rejected_at = new Date().toISOString();
    writeStorage(LOCAL_LEAD_ASSIGNMENTS_KEY, list);
    return { success: true };
  }
  return { success: false };
}

// -------------------------------------------------------------
// COMMERCIAL AGREEMENTS, REFERRALS & COMMISSION LEDGER
// -------------------------------------------------------------
export async function fetchDealerAgreements(dealerId?: string): Promise<DealerAgreement[]> {
  if (isCloudActive()) {
    try {
      let q = supabase.from('dealer_agreements').select('*').order('created_at', { ascending: false });
      if (dealerId) q = q.eq('dealer_id', dealerId);
      const { data, error } = await q;
      if (!error && data) return data as DealerAgreement[];
    } catch {}
  }
  let local = readStorage<DealerAgreement>(LOCAL_AGREEMENTS_KEY);
  if (dealerId) local = local.filter(a => a.dealer_id === dealerId);
  return local;
}

export async function fetchReferrals(dealerId?: string): Promise<Referral[]> {
  if (isCloudActive()) {
    try {
      let q = supabase.from('referrals').select('*').order('created_at', { ascending: false });
      if (dealerId) q = q.eq('dealer_id', dealerId);
      const { data, error } = await q;
      if (!error && data) return data as Referral[];
    } catch {}
  }
  let local = readStorage<Referral>(LOCAL_REFERRALS_KEY);
  if (dealerId) local = local.filter(r => r.dealer_id === dealerId);
  return local;
}

export async function fetchCommissionRecords(): Promise<CommissionRecord[]> {
  if (isCloudActive()) {
    try {
      const { data, error } = await supabase.from('commission_records').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as CommissionRecord[];
    } catch {}
  }
  return readStorage<CommissionRecord>(LOCAL_COMMISSIONS_KEY);
}

// -------------------------------------------------------------
// PRIVATE ASSET ACCESS REQUESTS (Phase 5)
// -------------------------------------------------------------
export async function submitPropertyAccessRequest(input: {
  propertyId: string;
  buyerId: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  const req: PropertyAccessRequest = {
    id: crypto.randomUUID ? crypto.randomUUID() : 'ar-' + Math.random().toString(36).substring(2, 9),
    property_id: input.propertyId,
    buyer_id: input.buyerId,
    reason: input.reason.trim(),
    status: 'pending',
    created_at: new Date().toISOString()
  };

  if (isCloudActive()) {
    try {
      const { error } = await supabase.from('property_access_requests').insert([req]);
      if (!error) return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  const list = readStorage<PropertyAccessRequest>(LOCAL_ACCESS_REQUESTS_KEY);
  list.unshift(req);
  writeStorage(LOCAL_ACCESS_REQUESTS_KEY, list);
  return { success: true };
}

export async function fetchPropertyAccessRequests(buyerId?: string): Promise<PropertyAccessRequest[]> {
  if (isCloudActive()) {
    try {
      let q = supabase.from('property_access_requests').select('*').order('created_at', { ascending: false });
      if (buyerId) q = q.eq('buyer_id', buyerId);
      const { data, error } = await q;
      if (!error && data) return data as PropertyAccessRequest[];
    } catch {}
  }
  let local = readStorage<PropertyAccessRequest>(LOCAL_ACCESS_REQUESTS_KEY);
  if (buyerId) local = local.filter(r => r.buyer_id === buyerId);
  return local;
}
