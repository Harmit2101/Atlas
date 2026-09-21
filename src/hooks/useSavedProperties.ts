import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const LOCAL_STORAGE_KEY = 'atlas_temp_saved_properties';

// Module-level shared store to prevent 24x redundant fetches when PropertyCard lists mount
let sharedSavedIds: string[] | null = null;
let currentLoadedUserId: string | null = null;
let inflightSyncPromise: Promise<string[]> | null = null;
const subscribers = new Set<(ids: string[]) => void>();

function notifySubscribers(ids: string[]) {
  sharedSavedIds = ids;
  subscribers.forEach(cb => cb(ids));
}

export function useSavedProperties() {
  const { user, authMode, isCloudAvailable } = useAuth();
  
  const isDemoMode = authMode === 'demo' || Boolean(user?.isDemo) || !isCloudAvailable;
  const storageKey = user?.id ? `atlas_saved_${user.id}` : LOCAL_STORAGE_KEY;

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    if (sharedSavedIds !== null) {
      return sharedSavedIds;
    }
    try {
      const item = localStorage.getItem(storageKey) || localStorage.getItem(LOCAL_STORAGE_KEY);
      const initial = item ? JSON.parse(item) : [];
      sharedSavedIds = initial;
      return initial;
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Subscribe to shared state updates
  useEffect(() => {
    subscribers.add(setSavedIds);
    return () => {
      subscribers.delete(setSavedIds);
    };
  }, []);

  // Sync with Supabase ONLY when operating with a genuine cloud account, deduplicated across all callers
  const loadSavedFromSupabase = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured || isDemoMode) return;
    
    // If already loaded for this user and data exists, skip redundant network call
    if (currentLoadedUserId === userId && sharedSavedIds !== null) {
      return;
    }

    // Reuse existing inflight promise if another component already triggered it
    if (inflightSyncPromise) {
      const ids = await inflightSyncPromise;
      setSavedIds(ids);
      return;
    }

    setLoading(true);
    inflightSyncPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('saved_properties')
          .select('property_id')
          .eq('user_id', userId);

        if (!error && data) {
          const cloudIds = data.map(row => row.property_id);
          
          const tempJson = localStorage.getItem(LOCAL_STORAGE_KEY);
          const tempIds: string[] = tempJson ? JSON.parse(tempJson) : [];
          const toMigrate = tempIds.filter(id => !cloudIds.includes(id));

          let finalIds = cloudIds;
          if (toMigrate.length > 0) {
            const insertPayload = toMigrate.map(property_id => ({
              user_id: userId,
              property_id,
              source: 'untera'
            }));
            await supabase.from('saved_properties').insert(insertPayload);
            finalIds = Array.from(new Set([...cloudIds, ...toMigrate]));
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }

          currentLoadedUserId = userId;
          localStorage.setItem(storageKey, JSON.stringify(finalIds));
          notifySubscribers(finalIds);
          return finalIds;
        }
        return sharedSavedIds || [];
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[ATLAS] Could not sync saved properties from Supabase:', err);
        }
        return sharedSavedIds || [];
      } finally {
        setLoading(false);
        inflightSyncPromise = null;
      }
    })();

    await inflightSyncPromise;
  }, [isDemoMode, storageKey]);

  useEffect(() => {
    if (user?.id && !isDemoMode) {
      loadSavedFromSupabase(user.id);
    } else {
      // Demo Mode or Unauthenticated: load strictly from local storage
      try {
        const item = localStorage.getItem(storageKey) || localStorage.getItem(LOCAL_STORAGE_KEY);
        const local = item ? JSON.parse(item) : [];
        if (sharedSavedIds === null || currentLoadedUserId !== null) {
          currentLoadedUserId = null;
          notifySubscribers(local);
        }
      } catch {
        notifySubscribers([]);
      }
    }
  }, [user?.id, isDemoMode, storageKey, loadSavedFromSupabase]);

  const toggleSave = async (propertyId: string, source: string = 'untera') => {
    const currentList = sharedSavedIds || savedIds;
    const isCurrentlySaved = currentList.includes(propertyId);
    const newIds = isCurrentlySaved 
      ? currentList.filter(id => id !== propertyId) 
      : [...currentList, propertyId];

    notifySubscribers(newIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newIds));
    } catch {}

    // Only make cloud request if NOT in demo mode
    if (user?.id && isSupabaseConfigured && !isDemoMode) {
      try {
        if (isCurrentlySaved) {
          await supabase
            .from('saved_properties')
            .delete()
            .eq('user_id', user.id)
            .eq('property_id', propertyId);
        } else {
          await supabase
            .from('saved_properties')
            .insert({
              user_id: user.id,
              property_id: propertyId,
              source
            });
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('[ATLAS] Error toggling saved property in Supabase:', e);
        }
      }
    }
  };

  const isSaved = (propertyId: string) => (sharedSavedIds || savedIds).includes(propertyId);

  const clearAll = async () => {
    notifySubscribers([]);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    if (user?.id && isSupabaseConfigured && !isDemoMode) {
      await supabase
        .from('saved_properties')
        .delete()
        .eq('user_id', user.id);
    }
  };

  return {
    savedIds: sharedSavedIds || savedIds,
    savedCount: (sharedSavedIds || savedIds).length,
    toggleSave,
    isSaved,
    clearAll,
    loading,
    isAuthenticated: Boolean(user)
  };
}

