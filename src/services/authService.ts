import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile } from '@/types/user';

const LOCAL_USER_KEY = 'atlas_local_auth_user';

export async function signUpWithEmail(email: string, password: string, displayName?: string): Promise<{ user: UserProfile | null; error: string | null }> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });

      if (error) return { user: null, error: error.message };

      if (data.user) {
        return {
          user: {
            id: data.user.id,
            email: data.user.email || email,
            displayName: displayName || email.split('@')[0],
            createdAt: data.user.created_at
          },
          error: null
        };
      }
    } catch (e: any) {
      return { user: null, error: e.message };
    }
  }

  // Local fallback auth session
  const fallbackUser: UserProfile = {
    id: `user-${Date.now().toString(36)}`,
    email,
    displayName: displayName || email.split('@')[0],
    createdAt: new Date().toISOString()
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
  return { user: fallbackUser, error: null };
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) return { user: null, error: error.message };

      if (data.user) {
        return {
          user: {
            id: data.user.id,
            email: data.user.email || email,
            displayName: data.user.user_metadata?.display_name || email.split('@')[0],
            createdAt: data.user.created_at
          },
          error: null
        };
      }
    } catch (e: any) {
      return { user: null, error: e.message };
    }
  }

  // Local fallback
  const fallbackUser: UserProfile = {
    id: `user-${Math.abs(email.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0))}`,
    email,
    displayName: email.split('@')[0],
    createdAt: new Date().toISOString()
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
  return { user: fallbackUser, error: null };
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut().catch(() => {});
  }
  localStorage.removeItem(LOCAL_USER_KEY);
}

export async function resetPasswordEmail(email: string): Promise<{ success: boolean; error: string | null }> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`
    });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }
  return { success: true, error: null };
}

export function getLocalUser(): UserProfile | null {
  try {
    const item = localStorage.getItem(LOCAL_USER_KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}
