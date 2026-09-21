import { useState, useEffect, useCallback } from 'react';
import { CountryBeacon, fetchSovereignBeacons } from '@/services/countryBeacons';

export function useCountryBeacons() {
  const [beacons, setBeacons] = useState<CountryBeacon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadBeacons = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSovereignBeacons(signal);
      setBeacons(data);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load sovereign country beacons');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadBeacons(controller.signal);
    return () => controller.abort();
  }, [loadBeacons]);

  return {
    beacons,
    loading,
    error,
    refetch: () => loadBeacons()
  };
}
