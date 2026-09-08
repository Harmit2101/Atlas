import { useState, useEffect, useCallback } from 'react';
import { MarketScore } from '@/types/market';
import { fetchMarketScores } from '@/services/marketService';

export function useMarkets() {
  const [scores, setScores] = useState<MarketScore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const loadScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMarketScores();
      setScores(res.scores);
      setTotal(res.total);
      if (res.error) setError(res.error);
    } catch (err: any) {
      setError(err.message || 'Failed to load market scores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  return {
    scores,
    loading,
    error,
    total,
    refetch: loadScores
  };
}
