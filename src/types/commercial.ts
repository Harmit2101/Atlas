// Atlas Commercial Platform Types (Phases 1 to 5)

export type UserRole = 'buyer' | 'dealer' | 'admin';
export type BuyerStatus = 'registered' | 'brief_submitted' | 'reviewing' | 'qualified' | 'matched';

export type InquiryStatus = 
  | 'new' 
  | 'reviewing' 
  | 'qualified' 
  | 'introduced' 
  | 'in_progress' 
  | 'closed_won' 
  | 'closed_lost' 
  | 'spam';

export type InquiryPriority = 'standard' | 'high' | 'urgent' | 'vip';
export type PurchaseTimeline = 'immediate' | '1_to_3_months' | '3_to_6_months' | 'exploratory';
export type BuyerType = 'individual' | 'family_office' | 'advisor_representative' | 'corporate_investor';
export type PurchasePurpose = 'primary_residence' | 'second_home' | 'investment' | 'development' | 'other';
export type FinancingStatus = 'cash' | 'financing' | 'undecided';
export type ProofOfFundsStatus = 'not_requested' | 'not_provided' | 'pending_review' | 'verified';

export interface Inquiry {
  id: string;
  property_id: string;
  property_source: 'untera' | 'direct_dealer' | 'mls_other';
  property_source_url?: string;
  property_title?: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  message: string;
  budget_min?: number;
  budget_max?: number;
  currency?: string;
  purchase_timeline?: PurchaseTimeline;
  buyer_type?: BuyerType;
  purpose?: PurchasePurpose;
  financing_status?: FinancingStatus;
  proof_of_funds_status: ProofOfFundsStatus;
  status: InquiryStatus;
  priority: InquiryPriority;
  assigned_dealer_id?: string | null;
  assigned_admin_id?: string | null;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referral_code?: string;
  notes?: string;
  last_contacted_at?: string;
  created_at: string;
  updated_at: string;
}

export type DealerStatus = 'pending' | 'verified' | 'suspended';
export type DealerCommercialStatus = 'trial' | 'partner' | 'inactive';
export type DealerMemberRole = 'owner' | 'admin' | 'agent' | 'viewer';

export interface DealerOrganization {
  id: string;
  name: string;
  slug: string;
  legal_name?: string;
  country: string;
  city: string;
  website?: string;
  description?: string;
  logo_url?: string;
  contact_email: string;
  phone?: string;
  status: DealerStatus;
  commercial_status: DealerCommercialStatus;
  pricing_plan?: string;
  created_at: string;
  updated_at: string;
}

export interface DealerMember {
  id: string;
  dealer_id: string;
  user_id: string;
  role: DealerMemberRole;
  created_at: string;
}

export type PropertyVisibility = 'public' | 'partner_only' | 'private' | 'nda_required';
export type AvailabilityStatus = 'available' | 'under_offer' | 'sold' | 'withdrawn';

export interface DealerProperty {
  id: string;
  dealer_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  transaction_type: 'sale' | 'rent' | 'auction';
  property_type: string;
  subtype?: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  area_sqft?: number;
  lot_size_sqm?: number;
  year_built?: number;
  address?: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  images: string[];
  floor_plan_urls?: string[];
  video_urls?: string[];
  virtual_tour_url?: string;
  features: string[];
  architectural_style?: string;
  visibility: PropertyVisibility;
  availability_status: AvailabilityStatus;
  created_at: string;
  updated_at: string;
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface ListingClaim {
  id: string;
  property_id: string;
  dealer_id?: string | null;
  claimant_user_id: string;
  claimant_name: string;
  claimant_email: string;
  brokerage_name: string;
  license_number?: string;
  status: ClaimStatus;
  notes?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface BuyerPreferences {
  id: string;
  user_id: string;
  preferred_markets: string[];
  budget_min?: number;
  budget_max?: number;
  currency: string;
  property_types: string[];
  min_bedrooms: number;
  min_sqm?: number;
  purchase_purpose: string;
  purchase_timeline: string;
  must_have_features: string[];
  notes?: string;
  updated_at: string;
}

export type LeadAssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'contacted' | 'completed';

export interface LeadAssignment {
  id: string;
  inquiry_id: string;
  dealer_id: string;
  assigned_by?: string;
  status: LeadAssignmentStatus;
  notes?: string;
  assigned_at: string;
  accepted_at?: string;
  rejected_at?: string;
}

export interface InquiryEvent {
  id: string;
  inquiry_id: string;
  actor_id?: string;
  event_type: 
    | 'inquiry_created'
    | 'qualification_updated'
    | 'assigned_to_dealer'
    | 'dealer_accepted'
    | 'dealer_rejected'
    | 'dealer_contacted'
    | 'buyer_contacted'
    | 'status_changed'
    | 'note_added';
  payload: Record<string, any>;
  created_at: string;
}

export type EngagementEventName = 
  | 'property_view'
  | 'property_gallery_interaction'
  | 'spatial_view_opened'
  | 'photo_rotunda_opened'
  | 'property_saved'
  | 'inquiry_started'
  | 'inquiry_submitted'
  | 'private_client_started'
  | 'private_client_completed';

export interface PropertyEngagementEvent {
  id: string;
  property_id: string;
  property_source: string;
  user_id?: string;
  event_name: EngagementEventName;
  metadata: Record<string, any>;
  created_at: string;
}

export type OpportunityStatus = 
  | 'introduced'
  | 'viewing'
  | 'negotiation'
  | 'under_contract'
  | 'closed'
  | 'lost'
  | 'cancelled';

export interface Opportunity {
  id: string;
  inquiry_id?: string;
  property_id: string;
  dealer_id: string;
  status: OpportunityStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type AgreementType = 'marketing' | 'lead_generation' | 'referral' | 'advisory' | 'other';
export type AgreementStatus = 'draft' | 'active' | 'expired' | 'terminated';

export interface DealerAgreement {
  id: string;
  dealer_id: string;
  agreement_type: AgreementType;
  status: AgreementStatus;
  effective_date: string;
  expiry_date?: string;
  terms_reference?: string;
  notes?: string;
  created_at: string;
}

export type ReferralStatus = 'pending' | 'accepted' | 'active' | 'closed' | 'declined' | 'cancelled';

export interface Referral {
  id: string;
  inquiry_id: string;
  dealer_id: string;
  property_id: string;
  agreement_id?: string;
  status: ReferralStatus;
  introduced_at: string;
  closed_at?: string;
  notes?: string;
  created_at: string;
}

export type CommissionStatus = 
  | 'not_applicable'
  | 'pending_review'
  | 'approved'
  | 'invoiced'
  | 'paid'
  | 'disputed'
  | 'cancelled';

export interface CommissionRecord {
  id: string;
  referral_id: string;
  agreement_id?: string;
  status: CommissionStatus;
  currency: string;
  amount?: number;
  calculation_basis?: string;
  due_date?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
}

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface PropertyAccessRequest {
  id: string;
  property_id: string;
  buyer_id: string;
  reason: string;
  status: AccessRequestStatus;
  notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface PropertyCollection {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  cover_image?: string;
  is_private: boolean;
  property_ids: string[];
  created_at: string;
  updated_at: string;
}
