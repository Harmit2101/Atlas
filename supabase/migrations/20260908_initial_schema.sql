-- ==============================================================================
-- ATLAS DATABASE INITIAL SCHEMA & ROW LEVEL SECURITY
-- Platform: Supabase PostgreSQL (Free Tier)
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Auto-create profile trigger on new auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. SAVED PROPERTIES TABLE (User Private Portfolio)
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'untera',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_saved_property UNIQUE (user_id, property_id, source)
);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON public.saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON public.saved_properties(property_id);

-- 3. PROPERTY CACHE TABLE (API Rate-Limit Shield)
CREATE TABLE IF NOT EXISTS public.property_cache (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'untera',
  source_listing_id TEXT NOT NULL,
  data JSONB NOT NULL,
  country TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '1 day') NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_property_cache_country ON public.property_cache(country);
CREATE INDEX IF NOT EXISTS idx_property_cache_city ON public.property_cache(city);
CREATE INDEX IF NOT EXISTS idx_property_cache_expires_at ON public.property_cache(expires_at);

-- 4. DESTINATION CACHE TABLE (Dynamic Regional Clusters)
CREATE TABLE IF NOT EXISTS public.destination_cache (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  property_count INTEGER DEFAULT 0 NOT NULL,
  data JSONB DEFAULT '{}'::jsonb NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_destination_cache_property_count ON public.destination_cache(property_count DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all user tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_cache ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- SAVED PROPERTIES POLICIES (Strict Private Access)
CREATE POLICY "Users can view only their own saved properties"
  ON public.saved_properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved properties"
  ON public.saved_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved properties"
  ON public.saved_properties FOR DELETE
  USING (auth.uid() = user_id);

-- CACHE POLICIES (Public read access for cached global listing data)
CREATE POLICY "Allow public read access to active property cache"
  ON public.property_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to destination cache"
  ON public.destination_cache FOR SELECT
  TO anon, authenticated
  USING (true);
