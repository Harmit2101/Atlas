import { useState, useEffect, useRef, useCallback } from 'react';
import { AtlasProperty, PropertyFilterState } from '@/types/property';
import { fetchProperties } from '@/services/propertyService';

export function useProperties(filter: PropertyFilterState = {}) {
  const [properties, setProperties] = useState<AtlasProperty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [source, setSource] = useState<'untera' | 'fallback'>('fallback');

  const abortControllerRef = useRef<AbortController | null>(null);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const loadProperties = useCallback(async () => {
    // Cancel previous inflight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await fetchProperties(filterRef.current, abortControllerRef.current.signal);
      setProperties(result.properties);
      setTotal(result.total);
      setIsLive(result.isLive);
      setSource(result.source);
      if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('[ATLAS] Property load exception:', err);
      setError(err.message || 'Failed to retrieve live listings.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search/filter changes
  useEffect(() => {
    const handler = setTimeout(() => {
      loadProperties();
    }, filter.searchQuery ? 400 : 50);

    return () => {
      clearTimeout(handler);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    filter.country,
    filter.location,
    filter.destinationId,
    filter.propertyType,
    filter.transactionType,
    filter.minPrice,
    filter.maxPrice,
    filter.bedrooms,
    filter.searchQuery,
    filter.sortBy,
    filter.page,
    loadProperties
  ]);

  return {
    properties,
    loading,
    error,
    total,
    isLive,
    source,
    refetch: loadProperties
  };
}
