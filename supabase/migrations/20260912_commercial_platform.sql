-- ==============================================================================
-- ATLAS COMMERCIAL PLATFORM DATABASE MIGRATION
-- Platform: Supabase PostgreSQL
-- Phases 1 to 5 Commercial Schema, RLS Policies, Indexes & Constraints
-- ==============================================================================

-- ==============================================================================
-- EXTENSION & USER ROLES
-- ==============================================================================

-- 1. Extend PROFILES with Role and Verification Status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'buyer' 
      CHECK (role IN ('buyer', 'dealer', 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'buyer_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN buyer_status TEXT NOT NULL DEFAULT 'registered'
      CHECK (buyer_status IN ('registered', 'brief_submitted', 'reviewing', 'qualified', 'matched'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_buyer_status ON public.profiles(buyer_status);

-- Helper function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if current authenticated user is a dealer member
CREATE OR REPLACE FUNCTION public.is_dealer_member(target_dealer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.dealer_members
    WHERE dealer_id = target_dealer_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- PHASE 2A: DEALER ORGANIZATIONS & MEMBERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.dealer_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  legal_name TEXT,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'suspended')),
  commercial_status TEXT NOT NULL DEFAULT 'trial' CHECK (commercial_status IN ('trial', 'partner', 'inactive')),
  pricing_plan TEXT DEFAULT 'founding_partner',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dealer_organizations_slug ON public.dealer_organizations(slug);
CREATE INDEX IF NOT EXISTS idx_dealer_organizations_status ON public.dealer_organizations(status);

CREATE TABLE IF NOT EXISTS public.dealer_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.dealer_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'admin', 'agent', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_dealer_member UNIQUE (dealer_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dealer_members_dealer ON public.dealer_members(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_members_user ON public.dealer_members(user_id);

-- ==============================================================================
-- PHASE 2C & 5A: DIRECT DEALER INVENTORY & PRIVATE ASSETS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.dealer_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.dealer_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  transaction_type TEXT NOT NULL DEFAULT 'sale' CHECK (transaction_type IN ('sale', 'rent', 'auction')),
  property_type TEXT NOT NULL DEFAULT 'villa',
  subtype TEXT,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  area_sqm DOUBLE PRECISION NOT NULL DEFAULT 0,
  area_sqft DOUBLE PRECISION,
  lot_size_sqm DOUBLE PRECISION,
  year_built INTEGER,
  address TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  floor_plan_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  virtual_tour_url TEXT,
  features TEXT[] DEFAULT '{}',
  architectural_style TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'partner_only', 'private', 'nda_required')),
  availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'under_offer', 'sold', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dealer_properties_dealer ON public.dealer_properties(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_properties_country ON public.dealer_properties(country);
CREATE INDEX IF NOT EXISTS idx_dealer_properties_city ON public.dealer_properties(city);
CREATE INDEX IF NOT EXISTS idx_dealer_properties_visibility ON public.dealer_properties(visibility);
CREATE INDEX IF NOT EXISTS idx_dealer_properties_price ON public.dealer_properties(price);

-- ==============================================================================
-- PHASE 1A: INQUIRIES & LEAD CAPTURE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL,
  property_source TEXT NOT NULL DEFAULT 'untera' CHECK (property_source IN ('untera', 'direct_dealer', 'mls_other')),
  property_source_url TEXT,
  property_title TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  message TEXT NOT NULL,
  budget_min DOUBLE PRECISION,
  budget_max DOUBLE PRECISION,
  currency TEXT DEFAULT 'USD',
  purchase_timeline TEXT CHECK (purchase_timeline IN ('immediate', '1_to_3_months', '3_to_6_months', 'exploratory')),
  buyer_type TEXT CHECK (buyer_type IN ('individual', 'family_office', 'advisor_representative', 'corporate_investor')),
  purpose TEXT CHECK (purpose IN ('primary_residence', 'second_home', 'investment', 'development', 'other')),
  financing_status TEXT CHECK (financing_status IN ('cash', 'financing', 'undecided')),
  proof_of_funds_status TEXT NOT NULL DEFAULT 'not_requested' CHECK (proof_of_funds_status IN ('not_requested', 'not_provided', 'pending_review', 'verified')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'qualified', 'introduced', 'in_progress', 'closed_won', 'closed_lost', 'spam')),
  priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN ('standard', 'high', 'urgent', 'vip')),
  assigned_dealer_id UUID REFERENCES public.dealer_organizations(id) ON DELETE SET NULL,
  assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'property_detail_concierge',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referral_code TEXT,
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON public.inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_dealer ON public.inquiries(assigned_dealer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- ==============================================================================
-- PHASE 2D: LISTING CLAIMS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.listing_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL,
  dealer_id UUID REFERENCES public.dealer_organizations(id) ON DELETE SET NULL,
  claimant_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claimant_name TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  brokerage_name TEXT NOT NULL,
  license_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listing_claims_property ON public.listing_claims(property_id);
CREATE INDEX IF NOT EXISTS idx_listing_claims_status ON public.listing_claims(status);

-- ==============================================================================
-- PHASE 3A & 3B: BUYER PREFERENCES & ACQUISITION BRIEFS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.buyer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_markets TEXT[] DEFAULT '{}',
  budget_min DOUBLE PRECISION,
  budget_max DOUBLE PRECISION,
  currency TEXT DEFAULT 'USD',
  property_types TEXT[] DEFAULT '{}',
  min_bedrooms INTEGER DEFAULT 1,
  min_sqm DOUBLE PRECISION,
  purchase_purpose TEXT DEFAULT 'investment',
  purchase_timeline TEXT DEFAULT '1_to_3_months',
  must_have_features TEXT[] DEFAULT '{}',
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_buyer_preferences_user ON public.buyer_preferences(user_id);

-- ==============================================================================
-- PHASE 3B & 3C: LEAD ROUTING & INQUIRY AUDIT TRAIL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES public.dealer_organizations(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'contacted', 'completed')),
  notes TEXT,
  assigned_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_inquiry ON public.lead_assignments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_dealer ON public.lead_assignments(dealer_id);

CREATE TABLE IF NOT EXISTS public.inquiry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'inquiry_created',
    'qualification_updated',
    'assigned_to_dealer',
    'dealer_accepted',
    'dealer_rejected',
    'dealer_contacted',
    'buyer_contacted',
    'status_changed',
    'note_added'
  )),
  payload JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inquiry_events_inquiry ON public.inquiry_events(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_events_created_at ON public.inquiry_events(created_at DESC);

-- ==============================================================================
-- PHASE 3D: FIRST-PARTY ENGAGEMENT ANALYTICS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.property_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL,
  property_source TEXT NOT NULL DEFAULT 'untera',
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL CHECK (event_name IN (
    'property_view',
    'property_gallery_interaction',
    'spatial_view_opened',
    'photo_rotunda_opened',
    'property_saved',
    'inquiry_started',
    'inquiry_submitted',
    'private_client_started',
    'private_client_completed'
  )),
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_engagement_property ON public.property_engagement_events(property_id);
CREATE INDEX IF NOT EXISTS idx_engagement_event ON public.property_engagement_events(event_name);
CREATE INDEX IF NOT EXISTS idx_engagement_created ON public.property_engagement_events(created_at DESC);

-- ==============================================================================
-- PHASE 4: TRANSACTION SUPPORT / REFERRAL / COMMISSION LEDGER
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  property_id TEXT NOT NULL,
  dealer_id UUID NOT NULL REFERENCES public.dealer_organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'introduced' CHECK (status IN (
    'introduced',
    'viewing',
    'negotiation',
    'under_contract',
    'closed',
    'lost',
    'cancelled'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_opportunities_dealer ON public.opportunities(dealer_id);

CREATE TABLE IF NOT EXISTS public.dealer_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.dealer_organizations(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL DEFAULT 'marketing' CHECK (agreement_type IN (
    'marketing',
    'lead_generation',
    'referral',
    'advisory',
    'other'
  )),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  terms_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agreements_dealer ON public.dealer_agreements(dealer_id);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES public.dealer_organizations(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  agreement_id UUID REFERENCES public.dealer_agreements(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'active', 'closed', 'declined', 'cancelled')),
  introduced_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  closed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referrals_dealer ON public.referrals(dealer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_inquiry ON public.referrals(inquiry_id);

CREATE TABLE IF NOT EXISTS public.commission_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  agreement_id UUID REFERENCES public.dealer_agreements(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
    'not_applicable',
    'pending_review',
    'approved',
    'invoiced',
    'paid',
    'disputed',
    'cancelled'
  )),
  currency TEXT NOT NULL DEFAULT 'USD',
  amount DOUBLE PRECISION,
  calculation_basis TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_commission_referral ON public.commission_records(referral_id);

-- ==============================================================================
-- PHASE 5B & 5D: PRIVATE ACCESS REQUESTS & CURATED COLLECTIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.property_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id TEXT NOT NULL,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_access_requests_property ON public.property_access_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_buyer ON public.property_access_requests(buyer_id);

CREATE TABLE IF NOT EXISTS public.property_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subtitle TEXT,
  description TEXT,
  cover_image TEXT,
  is_private BOOLEAN DEFAULT false NOT NULL,
  property_ids TEXT[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.property_collections(slug);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.dealer_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_collections ENABLE ROW LEVEL SECURITY;

-- DEALER ORGANIZATIONS
CREATE POLICY "Public can view verified dealers"
  ON public.dealer_organizations FOR SELECT
  USING (status = 'verified' OR public.is_admin());

CREATE POLICY "Dealers can view own organization"
  ON public.dealer_organizations FOR SELECT
  USING (public.is_dealer_member(id));

CREATE POLICY "Admins have full access to dealer organizations"
  ON public.dealer_organizations FOR ALL
  USING (public.is_admin());

-- DEALER MEMBERS
CREATE POLICY "Members can view own team"
  ON public.dealer_members FOR SELECT
  USING (dealer_id IN (SELECT dm.dealer_id FROM public.dealer_members dm WHERE dm.user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Admins have full access to dealer members"
  ON public.dealer_members FOR ALL
  USING (public.is_admin());

-- DEALER PROPERTIES
CREATE POLICY "Public can view public dealer properties"
  ON public.dealer_properties FOR SELECT
  USING (
    visibility = 'public' 
    OR public.is_dealer_member(dealer_id)
    OR public.is_admin()
  );

CREATE POLICY "Dealers can insert and update their own properties"
  ON public.dealer_properties FOR ALL
  USING (public.is_dealer_member(dealer_id) OR public.is_admin());

-- INQUIRIES
CREATE POLICY "Anyone can create an inquiry"
  ON public.inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Buyers can view their own inquiries"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Dealers can view inquiries assigned to them"
  ON public.inquiries FOR SELECT
  USING (
    assigned_dealer_id IN (
      SELECT dm.dealer_id FROM public.dealer_members dm WHERE dm.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Admins have full access to inquiries"
  ON public.inquiries FOR ALL
  USING (public.is_admin());

-- BUYER PREFERENCES
CREATE POLICY "Buyers manage their own preferences"
  ON public.buyer_preferences FOR ALL
  USING (auth.uid() = user_id OR public.is_admin());

-- LEAD ASSIGNMENTS
CREATE POLICY "Dealers view their assigned leads"
  ON public.lead_assignments FOR SELECT
  USING (
    dealer_id IN (
      SELECT dm.dealer_id FROM public.dealer_members dm WHERE dm.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Dealers update their assigned leads"
  ON public.lead_assignments FOR UPDATE
  USING (
    dealer_id IN (
      SELECT dm.dealer_id FROM public.dealer_members dm WHERE dm.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Admins have full control over lead assignments"
  ON public.lead_assignments FOR ALL
  USING (public.is_admin());

-- INQUIRY EVENTS
CREATE POLICY "Inquiry actors and admins can view events"
  ON public.inquiry_events FOR SELECT
  USING (
    inquiry_id IN (
      SELECT i.id FROM public.inquiries i 
      WHERE i.user_id = auth.uid() 
      OR i.assigned_dealer_id IN (SELECT dm.dealer_id FROM public.dealer_members dm WHERE dm.user_id = auth.uid())
    )
    OR public.is_admin()
  );

CREATE POLICY "System and users can record events"
  ON public.inquiry_events FOR INSERT
  WITH CHECK (true);

-- ENGAGEMENT ANALYTICS
CREATE POLICY "Public can record engagement"
  ON public.property_engagement_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins and dealers can view engagement metrics"
  ON public.property_engagement_events FOR SELECT
  USING (public.is_admin() OR auth.uid() IS NOT NULL);

-- LISTING CLAIMS
CREATE POLICY "Users can create listing claims"
  ON public.listing_claims FOR INSERT
  WITH CHECK (auth.uid() = claimant_user_id);

CREATE POLICY "Users view their own listing claims"
  ON public.listing_claims FOR SELECT
  USING (auth.uid() = claimant_user_id OR public.is_admin());

CREATE POLICY "Admins have full control of listing claims"
  ON public.listing_claims FOR ALL
  USING (public.is_admin());

-- PROPERTY ACCESS REQUESTS
CREATE POLICY "Buyers manage their access requests"
  ON public.property_access_requests FOR ALL
  USING (auth.uid() = buyer_id OR public.is_admin());

-- PROPERTY COLLECTIONS
CREATE POLICY "Public can view public collections"
  ON public.property_collections FOR SELECT
  USING (NOT is_private OR public.is_admin());

CREATE POLICY "Admins manage collections"
  ON public.property_collections FOR ALL
  USING (public.is_admin());

-- OPPORTUNITIES, AGREEMENTS, REFERRALS & COMMISSIONS
CREATE POLICY "Dealers view their opportunities and agreements"
  ON public.opportunities FOR SELECT
  USING (public.is_dealer_member(dealer_id) OR public.is_admin());

CREATE POLICY "Dealers view their agreements"
  ON public.dealer_agreements FOR SELECT
  USING (public.is_dealer_member(dealer_id) OR public.is_admin());

CREATE POLICY "Dealers view their referrals"
  ON public.referrals FOR SELECT
  USING (public.is_dealer_member(dealer_id) OR public.is_admin());

CREATE POLICY "Dealers view their commission records"
  ON public.commission_records FOR SELECT
  USING (
    referral_id IN (SELECT r.id FROM public.referrals r WHERE public.is_dealer_member(r.dealer_id))
    OR public.is_admin()
  );

CREATE POLICY "Admins manage all commercial ledger tables"
  ON public.opportunities FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage all agreements"
  ON public.dealer_agreements FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage all referrals"
  ON public.referrals FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage all commission records"
  ON public.commission_records FOR ALL USING (public.is_admin());

-- ==============================================================================
-- SECURITY ENFORCEMENT: PREVENT SELF-ROLE ESCALATION
-- Protects public.profiles so non-admin users cannot promote themselves
-- to 'dealer' or 'admin' or alter their buyer_status via direct client updates.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.buyer_status IS DISTINCT FROM NEW.buyer_status) THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'UNAUTHORIZED_PRIVILEGE_ESCALATION: You cannot modify your own platform role or verification status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();
