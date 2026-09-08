import { MarketScore, UnteraStats } from '@/types/market';
import { getMarketScores, getStats, isUnteraConfigured } from '@/lib/untera';

/**
 * Fetch live Global Property Index market scores across 70+ countries
 */
export async function fetchMarketScores(signal?: AbortSignal): Promise<{
  scores: MarketScore[];
  total: number;
  methodology?: string;
  error?: string;
}> {
  if (!isUnteraConfigured()) {
    return {
      scores: [],
      total: 0,
      error: 'Untera API key not configured in .env.local'
    };
  }

  try {
    const res = await getMarketScores(signal);
    return {
      scores: res.results || [],
      total: res.count || res.results?.length || 0,
      methodology: res.methodology
    };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return {
      scores: [],
      total: 0,
      error: err.message || 'Failed to retrieve market scores'
    };
  }
}

/**
 * Fetch live platform statistics (listings count, sources, countries)
 */
export async function fetchPlatformStats(signal?: AbortSignal): Promise<{
  stats: UnteraStats | null;
  error?: string;
}> {
  if (!isUnteraConfigured()) {
    return { stats: null, error: 'Untera API key not configured' };
  }

  try {
    const stats = await getStats(signal);
    return { stats };
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    return { stats: null, error: err.message || 'Failed to retrieve platform stats' };
  }
}
