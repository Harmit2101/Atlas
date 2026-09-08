import { AtlasProperty } from '@/types/property';
import { DestinationCluster } from '@/types/destination';
import { DESTINATIONS as FALLBACK_DESTINATIONS } from '@/data/destinations';

/**
 * Derives dynamic destination clusters from an array of properties.
 * Transforms properties -> geographic clusters -> interactive globe markers.
 */
export function deriveDestinationClusters(properties: AtlasProperty[]): DestinationCluster[] {
  if (!properties || properties.length === 0) {
    return FALLBACK_DESTINATIONS.map(d => ({
      ...d,
      properties: []
    }));
  }

  // Group properties by city + country key
  const clusterMap = new Map<string, {
    name: string;
    country: string;
    lats: number[];
    lngs: number[];
    prices: number[];
    properties: AtlasProperty[];
  }>();

  for (const prop of properties) {
    const cityName = prop.city || prop.country || 'Global';
    const key = `${cityName.toLowerCase()}_${prop.country.toLowerCase()}`;

    let cluster = clusterMap.get(key);
    if (!cluster) {
      cluster = {
        name: cityName,
        country: prop.country,
        lats: [],
        lngs: [],
        prices: [],
        properties: []
      };
      clusterMap.set(key, cluster);
    }

    if (prop.latitude && prop.longitude) {
      cluster.lats.push(prop.latitude);
      cluster.lngs.push(prop.longitude);
    }
    if (prop.price) {
      cluster.prices.push(prop.price);
    }
    cluster.properties.push(prop);
  }

  const dynamicClusters: DestinationCluster[] = [];

  clusterMap.forEach((cluster, key) => {
    // Calculate geographic centroid
    const avgLat = cluster.lats.length > 0 
      ? cluster.lats.reduce((a, b) => a + b, 0) / cluster.lats.length 
      : 25.0;
    const avgLng = cluster.lngs.length > 0 
      ? cluster.lngs.reduce((a, b) => a + b, 0) / cluster.lngs.length 
      : 55.0;

    // Calculate average price
    const avgPrice = cluster.prices.length > 0
      ? Math.round(cluster.prices.reduce((a, b) => a + b, 0) / cluster.prices.length)
      : 0;

    const id = key.replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');

    const latDir = avgLat >= 0 ? 'N' : 'S';
    const lngDir = avgLng >= 0 ? 'E' : 'W';
    const coordsFormatted = `${Math.abs(avgLat).toFixed(4)}° ${latDir}, ${Math.abs(avgLng).toFixed(4)}° ${lngDir}`;

    dynamicClusters.push({
      id,
      name: cluster.name,
      country: cluster.country,
      latitude: avgLat,
      longitude: avgLng,
      propertyCount: cluster.properties.length,
      featured: cluster.properties.length > 1,
      tagline: `Prime architectural opportunities in ${cluster.name}`,
      description: `Active portfolio of ${cluster.properties.length} verified listings in ${cluster.name}, ${cluster.country}.`,
      averagePrice: avgPrice > 0 ? `$${(avgPrice / 1000000).toFixed(1)}M` : 'Inquire',
      image: cluster.properties[0]?.images[0] || 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      coordinatesFormatted: coordsFormatted,
      properties: cluster.properties
    });
  });

  // If dynamic clusters are sparse, seamlessly merge with existing global anchor hubs
  if (dynamicClusters.length < 5) {
    const existingNames = new Set(dynamicClusters.map(d => d.name.toLowerCase()));
    for (const fb of FALLBACK_DESTINATIONS) {
      if (!existingNames.has(fb.name.toLowerCase())) {
        dynamicClusters.push({
          ...fb,
          properties: []
        });
      }
    }
  }

  return dynamicClusters.sort((a, b) => b.propertyCount - a.propertyCount);
}
