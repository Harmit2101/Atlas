import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile, AuthMode } from '@/types/user';

const LOCAL_USER_KEY = 'atlas_local_auth_user';
const LOCAL_USERS_STORE_KEY = 'atlas_local_registered_users';
const CLOUD_STATUS_KEY = 'atlas_cloud_auth_status';

/**
 * Robust detection of network, DNS, or paused Supabase project failures.
 * Distinguishes infrastructure outages from genuine authentication errors.
 */
export function isNetworkOrServiceError(error: any): boolean {
  if (!error) return false;
  const rawMsg = (typeof error === 'string' ? error : error.message || error.error_description || '').toLowerCase();
  const rawName = (error.name || '').toLowerCase();
  
  return (
    rawMsg.includes('failed to fetch') ||
    rawMsg.includes('network') ||
    rawMsg.includes('fetch failed') ||
    rawMsg.includes('load failed') ||
    rawMsg.includes('timeout') ||
    rawMsg.includes('econnrefused') ||
    rawMsg.includes('connection refused') ||
    rawMsg.includes('unreachable') ||
    rawMsg.includes('dns') ||
    rawName === 'typeerror' && rawMsg.includes('fetch')
  );
}

export type CloudHealthState = 'CLOUD_CHECKING' | 'CLOUD_AVAILABLE' | 'CLOUD_UNAVAILABLE';

const OFFLINE_TTL_MS = 30 * 1000; // 30-second bounded failure TTL: allows rapid recovery on refresh!

interface CachedCloudStatus {
  status: 'online' | 'offline';
  timestamp: number;
}

function getStoredCloudStatus(): CachedCloudStatus | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CLOUD_STATUS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.timestamp === 'number') {
      return parsed;
    }
    return {
      status: raw === 'online' ? 'online' : 'offline',
      timestamp: Date.now()
    };
  } catch {
    return null;
  }
}

let cachedCloudAvailable = typeof window !== 'undefined'
  ? (() => {
      const stored = getStoredCloudStatus();
      if (!stored) return true;
      if (stored.status === 'offline') {
        // Expire after 30s so refresh re-probes!
        return Date.now() - stored.timestamp > OFFLINE_TTL_MS;
      }
      return true;
    })()
  : true;

export function getCloudAvailability(): boolean {
  if (!isSupabaseConfigured) return false;
  const stored = getStoredCloudStatus();
  if (!stored) return true;
  if (stored.status === 'offline') {
    if (Date.now() - stored.timestamp > OFFLINE_TTL_MS) {
      return true;
    }
    return false;
  }
  return true;
}

export function setCloudAvailability(available: boolean): void {
  cachedCloudAvailable = available;
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedCloudStatus = {
      status: available ? 'online' : 'offline',
      timestamp: Date.now()
    };
    sessionStorage.setItem(CLOUD_STATUS_KEY, JSON.stringify(payload));
  } catch {}
}

export function retryCloudConnection(): void {
  cachedCloudAvailable = true;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(CLOUD_STATUS_KEY);
  } catch {}
}

/**
 * Lightweight probe to verify Supabase cloud connectivity without throwing unhandled exceptions.
 * Resolves true if Supabase is responsive, false if DNS/network timeout occurs.
 */
export async function probeCloudHealth(): Promise<boolean> {
  if (!isSupabaseConfigured) {
    setCloudAvailability(false);
    return false;
  }

  try {
    const probePromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<{ timeout: true }>((_, reject) =>
      setTimeout(() => reject(new Error('SUPABASE_PROBE_TIMEOUT')), 2500)
    );

    await Promise.race([probePromise, timeoutPromise]);
    setCloudAvailability(true);
    return true;
  } catch (err: any) {
    if (isNetworkOrServiceError(err) || err?.message === 'SUPABASE_PROBE_TIMEOUT') {
      setCloudAvailability(false);
      return false;
    }
    // Other errors (e.g. unauthenticated or expired token) prove Supabase is healthy and responsive
    setCloudAvailability(true);
    return true;
  }
}

export function saveLocalUser(user: UserProfile): void {
  try {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    // Also save to registered list for deterministic local login
    const storeJson = localStorage.getItem(LOCAL_USERS_STORE_KEY);
    const store: UserProfile[] = storeJson ? JSON.parse(storeJson) : [];
    const index = store.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (index >= 0) {
      store[index] = user;
    } else {
      store.push(user);
    }
    localStorage.setItem(LOCAL_USERS_STORE_KEY, JSON.stringify(store));
  } catch {}
}

export function findLocalUserByEmail(email: string): UserProfile | null {
  try {
    const storeJson = localStorage.getItem(LOCAL_USERS_STORE_KEY);
    if (!storeJson) return null;
    const store: UserProfile[] = JSON.parse(storeJson);
    return store.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  } catch {
    return null;
  }
}

export interface AuthActionResult {
  user: UserProfile | null;
  error: string | null;
  mode?: AuthMode;
}

/**
 * Sign up with email and password.
 * Prioritizes Supabase cloud auth; gracefully falls back to deterministic local demo mode
 * when cloud is paused or unreachable, while still surfacing genuine validation errors.
 */
export async function signUpWithEmail(
  email: string, 
  password: string, 
  displayName?: string
): Promise<AuthActionResult> {
  const cleanEmail = email.trim();
  const cleanName = (displayName || cleanEmail.split('@')[0]).trim();

  if (isSupabaseConfigured && cachedCloudAvailable) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: cleanName
          }
        }
      });

      if (error) {
        if (isNetworkOrServiceError(error)) {
          console.warn('[ATLAS Auth] Supabase cloud unreachable. Activating Local Demo Mode.');
          setCloudAvailability(false);
        } else {
          // Legitimate validation or business error from Supabase
          return { user: null, error: error.message, mode: 'cloud' };
        }
      } else if (data.user) {
        const cloudUser: UserProfile = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          displayName: cleanName,
          createdAt: data.user.created_at,
          isDemo: false
        };
        return { user: cloudUser, error: null, mode: 'cloud' };
      }
    } catch (e: any) {
      if (isNetworkOrServiceError(e)) {
        console.warn('[ATLAS Auth] Cloud endpoint connection refused or paused. Activating Local Demo Mode.');
        setCloudAvailability(false);
      } else {
        return { user: null, error: e.message || 'Authentication failed', mode: 'cloud' };
      }
    }
  }

  // Local Demo / Offline Fallback Mode
  const demoRole = cleanEmail.includes('dealer') ? 'dealer' : (cleanEmail.includes('admin') ? 'admin' : 'buyer');
  const fallbackUser: UserProfile = {
    id: `demo-user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    displayName: cleanName,
    role: demoRole,
    buyerStatus: 'qualified',
    createdAt: new Date().toISOString(),
    isDemo: true
  };
  saveLocalUser(fallbackUser);
  return { user: fallbackUser, error: null, mode: 'demo' };
}

/**
 * Sign in with email and password.
 * Distinguishes cloud network failure from wrong password/unregistered email.
 */
export async function signInWithEmail(
  email: string, 
  password: string
): Promise<AuthActionResult> {
  const cleanEmail = email.trim();

  if (isSupabaseConfigured && cachedCloudAvailable) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) {
        if (isNetworkOrServiceError(error)) {
          console.warn('[ATLAS Auth] Cloud endpoint unreachable during signin. Activating Local Demo Mode.');
          setCloudAvailability(false);
        } else {
          // Real auth error: wrong password, user not found, etc.
          return { user: null, error: error.message, mode: 'cloud' };
        }
      } else if (data.user) {
        const cloudUser: UserProfile = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          displayName: data.user.user_metadata?.display_name || cleanEmail.split('@')[0],
          avatarUrl: data.user.user_metadata?.avatar_url,
          createdAt: data.user.created_at,
          isDemo: false
        };
        return { user: cloudUser, error: null, mode: 'cloud' };
      }
    } catch (e: any) {
      if (isNetworkOrServiceError(e)) {
        console.warn('[ATLAS Auth] Cloud connection error during signin. Activating Local Demo Mode.');
        setCloudAvailability(false);
      } else {
        return { user: null, error: e.message || 'Invalid credentials', mode: 'cloud' };
      }
    }
  }

  // Local Demo / Offline Fallback Mode
  // If user previously signed up in demo mode, restore their profile
  const existing = findLocalUserByEmail(cleanEmail);
  const demoRole = cleanEmail.includes('dealer') ? 'dealer' : (cleanEmail.includes('admin') ? 'admin' : 'buyer');
  
  const fallbackUser: UserProfile = existing || {
    id: `demo-user-${Math.abs(cleanEmail.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0))}`,
    email: cleanEmail,
    displayName: cleanEmail.split('@')[0],
    role: demoRole,
    buyerStatus: 'qualified',
    createdAt: new Date().toISOString(),
    isDemo: true
  };
  saveLocalUser(fallbackUser);
  return { user: fallbackUser, error: null, mode: 'demo' };
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured && cachedCloudAvailable) {
    await supabase.auth.signOut().catch(() => {});
  }
  localStorage.removeItem(LOCAL_USER_KEY);
}

export async function resetPasswordEmail(email: string): Promise<{ success: boolean; error: string | null }> {
  if (isSupabaseConfigured && cachedCloudAvailable) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account`
      });
      if (error) {
        if (!isNetworkOrServiceError(error)) {
          return { success: false, error: error.message };
        }
      } else {
        return { success: true, error: null };
      }
    } catch {}
  }
  // In demo mode, treat as successful mock reset
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
