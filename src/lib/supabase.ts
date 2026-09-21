import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your_supabase_anon_key')
);

if (!isSupabaseConfigured && import.meta.env.DEV && typeof window !== 'undefined' && window.localStorage?.getItem('atlas_debug') === '1') {
  console.info(
    '[ATLAS] Supabase credentials not set in .env.local. Operating with local persistent session storage.'
  );
}

// Create Supabase client singleton with fallback URL to prevent crashes if unconfigured
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-atlas.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
