import { AtlasProperty } from '@/types/property';
import { DestinationCluster } from '@/types/destination';

/**
 * Validates whether a property has usable numeric geographic coordinates.
 * Discards null, undefined, NaN, and (0,0) coordinates without guessing or fabricating.
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng)) return false;
  // (0, 0) is "Null Island" — an unlocated placeholder, not a valid real estate location
  if (nLat === 0 && nLng === 0) return false;
  if (nLat < -90 || nLat > 90) return false;
  if (nLng < -180 || nLng > 180) return false;
  return true;
}

/**
 * Calculates great-circle distance between two geographic coordinates in kilometers.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Extracts the most relevant localized name and country from a live property's data.
 */
export function extractPropertyLocation(prop: AtlasProperty): { name: string; country: string } {
  const country = (prop.country && prop.country !== 'Global Territory' && prop.country !== 'Global')
    ? prop.country.trim()
    : 'Verified Global MLS';

  let name = (prop.city && prop.city !== 'Global Territory' && prop.city !== 'Global')
    ? prop.city.trim()
    : '';

  if (!name && prop.locality) {
    name = prop.locality.trim();
  }

  // If city is absent, inspect the raw address
  if (!name && prop.address) {
    const segments = prop.address.split(',').map(s => s.trim()).filter(Boolean);
    if (segments.length >= 2) {
      name = segments[segments.length - 1];
    } else if (segments.length === 1) {
      name = segments[0];
    }
  }

  if (!name) {
    name = country;
  }

  return { name, country };
}

/**
 * Computes comprehensive cartography metrics from the current live property inventory.
 */
export function getCartographyStats(properties: AtlasProperty[] = []): {
  totalListings: number;
  geocodedCount: number;
  nonGeocodedCount: number;
  clusterCount: number;
  uniqueLocationsCount: number;
} {
  const geocoded = properties.filter(p => isValidCoordinate(p.latitude, p.longitude));
  const uniqueCoordKeys = new Set<string>();
  for (const p of geocoded) {
    const key = `${p.latitude.toFixed(4)}_${p.longitude.toFixed(4)}`;
    uniqueCoordKeys.add(key);
  }

  const clusters = deriveDestinationClusters(properties);

  return {
    totalListings: properties.length,
    geocodedCount: geocoded.length,
    nonGeocodedCount: properties.length - geocoded.length,
    clusterCount: clusters.length,
    uniqueLocationsCount: uniqueCoordKeys.size
  };
}

/**
 * Derives dynamic destination clusters strictly and exclusively from currently loaded live properties.
 * 
 * Rules:
 * 1. Takes all currently loaded live listings.
 * 2. Discards listings without valid coordinates (no guessing, no fabrication, no fallback coordinates).
 * 3. Uses an adaptive ~25km spatial proximity threshold for grouping nearby properties into regional clusters.
 * 4. Each cluster stores the exact list of live `properties: AtlasProperty[]` belonging to it.
 * 5. Computes cluster centroid (mean latitude, mean longitude) and live pricing/summary metrics.
 * 6. ZERO static hubs, ZERO hardcoded coordinates, ZERO fake fallback inventory.
 */
export function deriveDestinationClusters(
  properties: AtlasProperty[] = [],
  clusterRadiusKm = 25
): DestinationCluster[] {
  if (!properties || properties.length === 0) {
    return [];
  }

  // 1. Filter to live listings with strictly valid coordinates
  const geocodedProperties = properties.filter(prop => 
    isValidCoordinate(prop.latitude, prop.longitude)
  );

  if (geocodedProperties.length === 0) {
    return [];
  }

  // 2. Spatial proximity clustering (adaptive ~25 km threshold)
  interface IntermediateCluster {
    lats: number[];
    lngs: number[];
    centroidLat: number;
    centroidLng: number;
    properties: AtlasProperty[];
  }

  const clusters: IntermediateCluster[] = [];

  for (const prop of geocodedProperties) {
    const lat = Number(prop.latitude);
    const lng = Number(prop.longitude);

    let nearestCluster: IntermediateCluster | null = null;
    let minDistance = Infinity;

    for (const cluster of clusters) {
      const dist = haversineDistanceKm(cluster.centroidLat, cluster.centroidLng, lat, lng);
      if (dist <= clusterRadiusKm && dist < minDistance) {
        minDistance = dist;
        nearestCluster = cluster;
      }
    }

    if (nearestCluster) {
      nearestCluster.properties.push(prop);
      nearestCluster.lats.push(lat);
      nearestCluster.lngs.push(lng);
      // Recalculate cluster centroid dynamically
      nearestCluster.centroidLat =
        nearestCluster.lats.reduce((a, b) => a + b, 0) / nearestCluster.lats.length;
      nearestCluster.centroidLng =
        nearestCluster.lngs.reduce((a, b) => a + b, 0) / nearestCluster.lngs.length;
    } else {
      clusters.push({
        lats: [lat],
        lngs: [lng],
        centroidLat: lat,
        centroidLng: lng,
        properties: [prop]
      });
    }
  }

  // 3. Transform intermediate clusters into DestinationCluster models
  const destinationClusters: DestinationCluster[] = clusters.map((cluster, index) => {
    const propCount = cluster.properties.length;
    const avgLat = cluster.centroidLat;
    const avgLng = cluster.centroidLng;

    // Determine the most frequent name and country among cluster members
    const nameFrequency = new Map<string, number>();
    const countryFrequency = new Map<string, number>();
    const validPrices: number[] = [];

    for (const prop of cluster.properties) {
      const { name, country } = extractPropertyLocation(prop);
      nameFrequency.set(name, (nameFrequency.get(name) || 0) + 1);
      countryFrequency.set(country, (countryFrequency.get(country) || 0) + 1);

      if (prop.priceUsd && prop.priceUsd > 0) {
        validPrices.push(prop.priceUsd);
      }
    }

    // Pick top name (default to first property's city or country)
    let topName = cluster.properties[0]?.city || cluster.properties[0]?.country || 'Verified Region';
    let maxNameCount = 0;
    nameFrequency.forEach((count, name) => {
      if (count > maxNameCount) {
        maxNameCount = count;
        topName = name;
      }
    });

    // Pick top country (default to first property's country)
    let topCountry = cluster.properties[0]?.country || 'Verified Global MLS';
    let maxCountryCount = 0;
    countryFrequency.forEach((count, country) => {
      if (count > maxCountryCount) {
        maxCountryCount = count;
        topCountry = country;
      }
    });

    const avgPrice = validPrices.length > 0
      ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
      : 0;

    const latDir = avgLat >= 0 ? 'N' : 'S';
    const lngDir = avgLng >= 0 ? 'E' : 'W';
    const coordsFormatted = `${Math.abs(avgLat).toFixed(4)}° ${latDir}, ${Math.abs(avgLng).toFixed(4)}° ${lngDir}`;

    const id = `cluster-${topName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${index}`;

    // Clean representative image preview from live properties in cluster
    const image = cluster.properties.find(p => p.images && p.images[0])?.images?.[0] || '';

    return {
      id,
      name: topName,
      country: topCountry,
      latitude: avgLat,
      longitude: avgLng,
      propertyCount: propCount,
      featured: propCount > 1,
      tagline: `${propCount} active live ${propCount === 1 ? 'asset' : 'assets'} in ${topName}`,
      description: `Active portfolio of ${propCount} verified live ${propCount === 1 ? 'listing' : 'listings'} in ${topName}, ${topCountry}.`,
      averagePrice: avgPrice > 0 ? `$${(avgPrice / 1000000).toFixed(1)}M` : 'Price on Inquiry',
      image,
      coordinatesFormatted: coordsFormatted,
      properties: cluster.properties
    };
  });

  // Sort descending by propertyCount
  return destinationClusters.sort((a, b) => b.propertyCount - a.propertyCount);
}
