import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  Inquiry, 
  InquiryStatus, 
  InquiryPriority, 
  InquiryEvent, 
  ListingClaim, 
  ClaimStatus,
  PropertyEngagementEvent,
  EngagementEventName
} from '@/types/commercial';

const LOCAL_STORAGE_INQUIRIES_KEY = 'atlas_local_inquiries';
const LOCAL_STORAGE_EVENTS_KEY = 'atlas_local_inquiry_events';
const LOCAL_STORAGE_CLAIMS_KEY = 'atlas_local_listing_claims';

// Helper for local mock storage fallback when Supabase is not configured or offline
function getLocalInquiries(): Inquiry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INQUIRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInquiries(items: Inquiry[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_INQUIRIES_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('[ATLAS] Failed to save local inquiries', e);
  }
}

export interface CreateInquiryInput {
  propertyId: string;
  propertySource: 'untera' | 'direct_dealer' | 'mls_other';
  propertySourceUrl?: string;
  propertyTitle?: string;
  userId?: string | null;
  fullName: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  message: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  purchaseTimeline?: Inquiry['purchase_timeline'];
  buyerType?: Inquiry['buyer_type'];
  purpose?: Inquiry['purpose'];
  financingStatus?: Inquiry['financing_status'];
  source?: string;
}

export async function submitInquiry(input: CreateInquiryInput): Promise<{ data: Inquiry | null; error: string | null }> {
  const newInquiry: Inquiry = {
    id: crypto.randomUUID ? crypto.randomUUID() : 'inq-' + Math.random().toString(36).substring(2, 9),
    property_id: input.propertyId,
    property_source: input.propertySource,
    property_source_url: input.propertySourceUrl,
    property_title: input.propertyTitle,
    user_id: input.userId || null,
    full_name: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim(),
    whatsapp: input.whatsapp?.trim(),
    message: input.message.trim(),
    budget_min: input.budgetMin,
    budget_max: input.budgetMax,
    currency: input.currency || 'USD',
    purchase_timeline: input.purchaseTimeline,
    buyer_type: input.buyerType,
    purpose: input.purpose,
    financing_status: input.financingStatus,
    proof_of_funds_status: 'not_requested',
    status: 'new',
    priority: input.buyerType === 'family_office' ? 'high' : 'standard',
    source: input.source || 'property_detail_concierge',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .insert([{
          id: newInquiry.id,
          property_id: newInquiry.property_id,
          property_source: newInquiry.property_source,
          property_source_url: newInquiry.property_source_url,
          property_title: newInquiry.property_title,
          user_id: newInquiry.user_id,
          full_name: newInquiry.full_name,
          email: newInquiry.email,
          phone: newInquiry.phone,
          whatsapp: newInquiry.whatsapp,
          message: newInquiry.message,
          budget_min: newInquiry.budget_min,
          budget_max: newInquiry.budget_max,
          currency: newInquiry.currency,
          purchase_timeline: newInquiry.purchase_timeline,
          buyer_type: newInquiry.buyer_type,
          purpose: newInquiry.purpose,
          financing_status: newInquiry.financing_status,
          proof_of_funds_status: newInquiry.proof_of_funds_status,
          status: newInquiry.status,
          priority: newInquiry.priority,
          source: newInquiry.source
        }])
        .select()
        .single();

      if (error) {
        console.warn('[ATLAS] Supabase inquiry insert failed, falling back to local storage:', error.message);
        const locals = getLocalInquiries();
        locals.unshift(newInquiry);
        saveLocalInquiries(locals);
        return { data: newInquiry, error: null };
      }

      // Record audit event
      await recordInquiryEvent(newInquiry.id, 'inquiry_created', {
        source: newInquiry.source,
        property_id: newInquiry.property_id
      });

      return { data: data as Inquiry, error: null };
    } catch (e: any) {
      console.warn('[ATLAS] Inquiry submission network error, saving locally:', e);
      const locals = getLocalInquiries();
      locals.unshift(newInquiry);
      saveLocalInquiries(locals);
      return { data: newInquiry, error: null };
    }
  }

  // Local fallback
  const locals = getLocalInquiries();
  locals.unshift(newInquiry);
  saveLocalInquiries(locals);
  return { data: newInquiry, error: null };
}

export async function fetchInquiries(filter?: { status?: InquiryStatus; assignedDealerId?: string }): Promise<Inquiry[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('inquiries').select('*').order('created_at', { ascending: false });
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }
      if (filter?.assignedDealerId) {
        query = query.eq('assigned_dealer_id', filter.assignedDealerId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data as Inquiry[];
      }
    } catch (e) {
      console.warn('[ATLAS] Failed to fetch inquiries from Supabase:', e);
    }
  }

  let locals = getLocalInquiries();
  if (filter?.status) {
    locals = locals.filter(i => i.status === filter.status);
  }
  if (filter?.assignedDealerId) {
    locals = locals.filter(i => i.assigned_dealer_id === filter.assignedDealerId);
  }
  return locals;
}

export async function updateInquiryStatus(
  id: string, 
  status: InquiryStatus, 
  actorId?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ 
          status, 
          notes: notes ? notes : undefined,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (!error) {
        await recordInquiryEvent(id, 'status_changed', { new_status: status, notes });
        return { success: true };
      }
    } catch (e: any) {
      console.warn('[ATLAS] Error updating inquiry in Supabase:', e);
    }
  }

  const locals = getLocalInquiries();
  const idx = locals.findIndex(i => i.id === id);
  if (idx !== -1) {
    locals[idx].status = status;
    if (notes) locals[idx].notes = notes;
    locals[idx].updated_at = new Date().toISOString();
    saveLocalInquiries(locals);
    return { success: true };
  }
  return { success: false, error: 'Inquiry not found' };
}

export async function recordInquiryEvent(
  inquiryId: string, 
  eventType: InquiryEvent['event_type'], 
  payload: Record<string, any> = {},
  actorId?: string
): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('inquiry_events').insert([{
        inquiry_id: inquiryId,
        actor_id: actorId || null,
        event_type: eventType,
        payload
      }]);
    } catch (e) {
      console.warn('[ATLAS] Failed to record inquiry event:', e);
    }
  }
}

export async function submitListingClaim(input: {
  propertyId: string;
  claimantUserId: string;
  claimantName: string;
  claimantEmail: string;
  brokerageName: string;
  licenseNumber?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const claim: ListingClaim = {
    id: crypto.randomUUID ? crypto.randomUUID() : 'clm-' + Math.random().toString(36).substring(2, 9),
    property_id: input.propertyId,
    claimant_user_id: input.claimantUserId,
    claimant_name: input.claimantName,
    claimant_email: input.claimantEmail,
    brokerage_name: input.brokerageName,
    license_number: input.licenseNumber,
    status: 'pending',
    notes: input.notes,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('listing_claims').insert([claim]);
      if (!error) return { success: true };
    } catch (e: any) {
      console.warn('[ATLAS] Failed to submit claim to Supabase:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLAIMS_KEY);
    const claims = raw ? JSON.parse(raw) : [];
    claims.unshift(claim);
    localStorage.setItem(LOCAL_STORAGE_CLAIMS_KEY, JSON.stringify(claims));
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Could not store claim locally' };
  }
}

export async function fetchListingClaims(): Promise<ListingClaim[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('listing_claims').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as ListingClaim[];
    } catch (e) {
      console.warn('[ATLAS] Error fetching listing claims:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLAIMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function updateListingClaimStatus(
  id: string, 
  status: ClaimStatus, 
  notes?: string
): Promise<{ success: boolean }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('listing_claims')
        .update({ status, notes, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (!error) return { success: true };
    } catch (e) {
      console.warn('[ATLAS] Error updating listing claim status:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLAIMS_KEY);
    const claims: ListingClaim[] = raw ? JSON.parse(raw) : [];
    const idx = claims.findIndex(c => c.id === id);
    if (idx !== -1) {
      claims[idx].status = status;
      if (notes) claims[idx].notes = notes;
      claims[idx].reviewed_at = new Date().toISOString();
      localStorage.setItem(LOCAL_STORAGE_CLAIMS_KEY, JSON.stringify(claims));
      return { success: true };
    }
  } catch {}
  return { success: false };
}

export async function recordEngagement(
  propertyId: string, 
  eventName: EngagementEventName, 
  metadata: Record<string, any> = {},
  userId?: string
): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('property_engagement_events').insert([{
        property_id: propertyId,
        user_id: userId || null,
        event_name: eventName,
        metadata
      }]);
    } catch {
      // Engagement tracking is best-effort
    }
  }
}
