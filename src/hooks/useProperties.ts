import { useState, useEffect, useRef, useCallback } from 'react';
import { AtlasProperty, PropertyFilterState } from '@/types/property';
import { fetchProperties } from '@/services/propertyService';

export function useProperties(filter: PropertyFilterState = {}) {
  const [properties, setProperties] = useState<AtlasProperty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(filter.page || 1);
  const [isLive, setIsLive] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const loadProperties = useCallback(async (isLoadMore: boolean = false) => {
    // Cancel previous inflight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    const targetPage = isLoadMore ? page + 1 : 1;

    try {
      const result = await fetchProperties(
        {
          ...filterRef.current,
          page: targetPage,
          pageSize: filterRef.current.pageSize || 24
        },
        abortControllerRef.current.signal
      );

      if (isLoadMore) {
        setProperties(prev => [...prev, ...result.properties]);
        setPage(targetPage);
      } else {
        setProperties(result.properties);
        setPage(1);
      }

      setTotal(result.total);
      setIsLive(result.isLive);
      if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('[ATLAS] Property load exception:', err);
      setError(err.message || 'Failed to retrieve live listings.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  // Debounce search/filter changes
  useEffect(() => {
    const handler = setTimeout(() => {
      loadProperties(false);
    }, filter.searchQuery ? 350 : 50);

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
    filter.tier,
    filter.minPrice,
    filter.maxPrice,
    filter.bedrooms,
    filter.bathrooms,
    filter.minSqm,
    filter.maxSqm,
    filter.searchQuery,
    filter.sortBy,
    filter.page
  ]);

  const loadMore = useCallback(async () => {
    if (!loading && !loadingMore && properties.length < total) {
      await loadProperties(true);
    }
  }, [loading, loadingMore, properties.length, total, loadProperties]);

  const hasMore = properties.length < total && properties.length > 0;

  return {
    properties,
    loading,
    loadingMore,
    error,
    total,
    page,
    hasMore,
    loadMore,
    isLive,
    refetch: () => loadProperties(false)
  };
}
