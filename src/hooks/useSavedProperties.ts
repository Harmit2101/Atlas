import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const LOCAL_STORAGE_KEY = 'atlas_temp_saved_properties';

export function useSavedProperties() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Sync with Supabase when authenticated
  const loadSavedFromSupabase = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      // 1. Fetch saved properties for user
      const { data, error } = await supabase
        .from('saved_properties')
        .select('property_id')
        .eq('user_id', userId);

      if (!error && data) {
        const cloudIds = data.map(row => row.property_id);
        
        // 2. Check if local temp saves exist to migrate
        const tempJson = localStorage.getItem(LOCAL_STORAGE_KEY);
        const tempIds: string[] = tempJson ? JSON.parse(tempJson) : [];
        const toMigrate = tempIds.filter(id => !cloudIds.includes(id));

        if (toMigrate.length > 0) {
          const insertPayload = toMigrate.map(property_id => ({
            user_id: userId,
            property_id,
            source: 'untera'
          }));
          await supabase.from('saved_properties').insert(insertPayload);
          setSavedIds(Array.from(new Set([...cloudIds, ...toMigrate])));
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        } else {
          setSavedIds(cloudIds);
        }
      }
    } catch (err) {
      console.warn('[ATLAS] Could not sync saved properties from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadSavedFromSupabase(user.id);
    } else {
      // Unauthenticated: load from local storage
      try {
        const item = localStorage.getItem(LOCAL_STORAGE_KEY);
        setSavedIds(item ? JSON.parse(item) : []);
      } catch {
        setSavedIds([]);
      }
    }
  }, [user?.id, loadSavedFromSupabase]);

  const toggleSave = async (propertyId: string, source: string = 'untera') => {
    const isCurrentlySaved = savedIds.includes(propertyId);
    const newIds = isCurrentlySaved 
      ? savedIds.filter(id => id !== propertyId) 
      : [...savedIds, propertyId];

    setSavedIds(newIds);

    if (user?.id && isSupabaseConfigured) {
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
        console.warn('[ATLAS] Error toggling saved property in Supabase:', e);
      }
    } else {
      // Persist in local storage
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newIds));
      } catch (e) {
        console.warn('[ATLAS] Could not save to local storage', e);
      }
    }
  };

  const isSaved = (propertyId: string) => savedIds.includes(propertyId);

  const clearAll = async () => {
    setSavedIds([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    if (user?.id && isSupabaseConfigured) {
      await supabase
        .from('saved_properties')
        .delete()
        .eq('user_id', user.id);
    }
  };

  return {
    savedIds,
    savedCount: savedIds.length,
    toggleSave,
    isSaved,
    clearAll,
    loading,
    isAuthenticated: Boolean(user)
  };
}
