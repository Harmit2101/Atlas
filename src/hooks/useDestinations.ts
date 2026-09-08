import { useMemo } from 'react';
import { DestinationCluster } from '@/types/destination';
import { AtlasProperty } from '@/types/property';
import { deriveDestinationClusters } from '@/services/destinationService';

export function useDestinations(properties: AtlasProperty[]): {
  destinations: DestinationCluster[];
  featuredDestinations: DestinationCluster[];
} {
  const destinations = useMemo(() => {
    return deriveDestinationClusters(properties);
  }, [properties]);

  const featuredDestinations = useMemo(() => {
    return destinations.filter(d => d.featured).slice(0, 6);
  }, [destinations]);

  return {
    destinations,
    featuredDestinations
  };
}
