import { useState, useEffect } from 'react';
import { UnteraStats } from '@/types/market';
import { fetchPlatformStats } from '@/services/marketService';

export function useStats() {
  const [stats, setStats] = useState<UnteraStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const res = await fetchPlatformStats();
        if (mounted) {
          setStats(res.stats);
          if (res.error) setError(res.error);
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return { stats, loading, error };
}
