import { AtlasProperty } from '@/types/property';
import { DestinationCluster } from '@/types/destination';
import { MarketScore } from '@/types/market';

// Standard country centroid coordinates for global territories
const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  'US': { lat: 37.0902, lng: -95.7129, name: 'United States' },
  'AE': { lat: 24.4539, lng: 54.3773, name: 'United Arab Emirates' },
  'GB': { lat: 55.3781, lng: -3.4360, name: 'United Kingdom' },
  'FR': { lat: 46.2276, lng: 2.2137, name: 'France' },
  'ES': { lat: 40.4637, lng: -3.7492, name: 'Spain' },
  'IT': { lat: 41.8719, lng: 12.5674, name: 'Italy' },
  'DE': { lat: 51.1657, lng: 10.4515, name: 'Germany' },
  'PT': { lat: 39.3999, lng: -8.2245, name: 'Portugal' },
  'GR': { lat: 39.0742, lng: 21.8243, name: 'Greece' },
  'CO': { lat: 4.5709, lng: -74.2973, name: 'Colombia' },
  'CR': { lat: 9.7489, lng: -83.7534, name: 'Costa Rica' },
  'PA': { lat: 8.5379, lng: -80.7821, name: 'Panama' },
  'MX': { lat: 23.6345, lng: -102.5528, name: 'Mexico' },
  'JP': { lat: 36.2048, lng: 138.2529, name: 'Japan' },
  'CH': { lat: 46.8182, lng: 8.2275, name: 'Switzerland' },
  'MC': { lat: 43.7384, lng: 7.4246, name: 'Monaco' },
  'SG': { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
  'AU': { lat: -25.2744, lng: 133.7751, name: 'Australia' },
  'ID': { lat: -0.7893, lng: 113.9213, name: 'Indonesia' },
  'ZA': { lat: -30.5595, lng: 22.9375, name: 'South Africa' },
  'GH': { lat: 7.9465, lng: -1.0232, name: 'Ghana' },
  'TH': { lat: 15.8700, lng: 100.9925, name: 'Thailand' },
  'BR': { lat: -14.2350, lng: -51.9253, name: 'Brazil' },
  'CA': { lat: 56.1304, lng: -106.3468, name: 'Canada' }
};

/**
 * Derives dynamic destination clusters from live properties or market score data.
 * Transforms live inventory -> geographic clusters -> interactive 3D globe markers.
 */
export function deriveDestinationClusters(
  properties: AtlasProperty[] = [],
  marketScores: MarketScore[] = []
): DestinationCluster[] {
  const clusterMap = new Map<string, {
    name: string;
    country: string;
    lats: number[];
    lngs: number[];
    prices: number[];
    properties: AtlasProperty[];
  }>();

  // 1. Cluster real properties
  for (const prop of properties) {
    const cityName = prop.city || prop.country || 'Global Territory';
    const countryKey = (prop.country || 'Global').toUpperCase();
    const key = `${cityName.toLowerCase()}_${countryKey.toLowerCase()}`;

    let cluster = clusterMap.get(key);
    if (!cluster) {
      cluster = {
        name: cityName,
        country: prop.country || countryKey,
        lats: [],
        lngs: [],
        prices: [],
        properties: []
      };
      clusterMap.set(key, cluster);
    }

    if (prop.latitude && prop.longitude && (prop.latitude !== 0 || prop.longitude !== 0)) {
      cluster.lats.push(prop.latitude);
      cluster.lngs.push(prop.longitude);
    } else if (COUNTRY_COORDINATES[countryKey]) {
      cluster.lats.push(COUNTRY_COORDINATES[countryKey].lat);
      cluster.lngs.push(COUNTRY_COORDINATES[countryKey].lng);
    }

    if (prop.priceUsd) {
      cluster.prices.push(prop.priceUsd);
    }
    cluster.properties.push(prop);
  }

  const dynamicClusters: DestinationCluster[] = [];

  clusterMap.forEach((cluster, key) => {
    const avgLat = cluster.lats.length > 0 
      ? cluster.lats.reduce((a, b) => a + b, 0) / cluster.lats.length 
      : 25.0;
    const avgLng = cluster.lngs.length > 0 
      ? cluster.lngs.reduce((a, b) => a + b, 0) / cluster.lngs.length 
      : 55.0;

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

  // 2. If property inventory is currently filtering a single region, enrich with active market score countries
  if (dynamicClusters.length < 8 && marketScores && marketScores.length > 0) {
    const existingCountries = new Set(dynamicClusters.map(c => c.country.toUpperCase()));
    for (const ms of marketScores.slice(0, 16)) {
      const code = ms.country.toUpperCase();
      if (!existingCountries.has(code) && COUNTRY_COORDINATES[code]) {
        const coord = COUNTRY_COORDINATES[code];
        const latDir = coord.lat >= 0 ? 'N' : 'S';
        const lngDir = coord.lng >= 0 ? 'E' : 'W';

        dynamicClusters.push({
          id: `market-${ms.country.toLowerCase()}`,
          name: ms.countryName,
          country: coord.name,
          latitude: coord.lat,
          longitude: coord.lng,
          propertyCount: ms.listingCount || 0,
          featured: ms.score >= 85,
          tagline: `Market Score: ${ms.score}/100 · Grade ${ms.grade}`,
          description: `Global Property Index score ${ms.score}. Ownership access: ${ms.ownershipAccess}. Affordability: ${ms.affordability}.`,
          averagePrice: `Score ${ms.score}`,
          image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
          coordinatesFormatted: `${Math.abs(coord.lat).toFixed(4)}° ${latDir}, ${Math.abs(coord.lng).toFixed(4)}° ${lngDir}`,
          properties: []
        });
      }
    }
  }

  return dynamicClusters.sort((a, b) => b.propertyCount - a.propertyCount);
}
