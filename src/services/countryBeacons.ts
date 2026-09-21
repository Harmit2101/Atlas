import { getMarketScores } from '@/lib/untera';
import { MarketScore } from '@/types/market';

export interface CountryBeacon {
  country: string; // ISO 2-letter code (e.g. 'IN', 'PA', 'US')
  countryName: string;
  latitude: number;
  longitude: number;
  listingCount: number;
  score: number;
  grade: string;
  ownershipAccess?: number | string;
  affordability?: number | string;
}

/**
 * High-precision geographic centroids for all 78+ sovereign territories tracked by Untera MLS syndicates.
 */
export const SOVEREIGN_CENTROIDS: Record<string, { name: string; lat: number; lng: number; defaultListings: number }> = {
  US: { name: 'United States', lat: 37.0902, lng: -95.7129, defaultListings: 420779 },
  BR: { name: 'Brazil', lat: -14.2350, lng: -51.9253, defaultListings: 264493 },
  IN: { name: 'India', lat: 20.5937, lng: 78.9629, defaultListings: 137728 },
  PA: { name: 'Panama', lat: 8.5379, lng: -80.7821, defaultListings: 62782 },
  CO: { name: 'Colombia', lat: 4.5709, lng: -74.2973, defaultListings: 48407 },
  ES: { name: 'Spain', lat: 40.4637, lng: -3.7492, defaultListings: 46210 },
  AE: { name: 'United Arab Emirates', lat: 23.4241, lng: 53.8478, defaultListings: 42150 },
  FR: { name: 'France', lat: 46.2276, lng: 2.2137, defaultListings: 38900 },
  GB: { name: 'United Kingdom', lat: 55.3781, lng: -3.4360, defaultListings: 37400 },
  PY: { name: 'Paraguay', lat: -23.4425, lng: -58.4438, defaultListings: 26915 },
  CR: { name: 'Costa Rica', lat: 9.7489, lng: -83.7534, defaultListings: 21110 },
  TR: { name: 'Turkey', lat: 38.9637, lng: 35.2433, defaultListings: 19363 },
  IT: { name: 'Italy', lat: 41.8719, lng: 12.5674, defaultListings: 18500 },
  PT: { name: 'Portugal', lat: 39.3999, lng: -8.2245, defaultListings: 16800 },
  MX: { name: 'Mexico', lat: 23.6345, lng: -102.5528, defaultListings: 15400 },
  BH: { name: 'Bahrain', lat: 26.0667, lng: 50.5577, defaultListings: 13784 },
  EG: { name: 'Egypt', lat: 26.8206, lng: 30.8025, defaultListings: 10804 },
  GR: { name: 'Greece', lat: 39.0742, lng: 21.8243, defaultListings: 10200 },
  RS: { name: 'Serbia', lat: 44.0165, lng: 21.0059, defaultListings: 8426 },
  UY: { name: 'Uruguay', lat: -32.5228, lng: -55.7658, defaultListings: 7950 },
  SA: { name: 'Saudi Arabia', lat: 23.8859, lng: 45.0792, defaultListings: 7420 },
  QA: { name: 'Qatar', lat: 25.3548, lng: 51.1839, defaultListings: 7100 },
  CL: { name: 'Chile', lat: -35.6751, lng: -71.5430, defaultListings: 6850 },
  JO: { name: 'Jordan', lat: 30.5852, lng: 36.2384, defaultListings: 6540 },
  CZ: { name: 'Czech Republic', lat: 49.8175, lng: 15.4730, defaultListings: 6200 },
  ZA: { name: 'South Africa', lat: -30.5595, lng: 22.9375, defaultListings: 5900 },
  CY: { name: 'Cyprus', lat: 35.1264, lng: 33.4299, defaultListings: 5600 },
  SE: { name: 'Sweden', lat: 60.1282, lng: 18.6435, defaultListings: 5400 },
  BS: { name: 'Bahamas', lat: 25.0343, lng: -77.3963, defaultListings: 5100 },
  ID: { name: 'Indonesia', lat: -0.7893, lng: 113.9213, defaultListings: 4950 },
  PE: { name: 'Peru', lat: -9.1900, lng: -75.0152, defaultListings: 4800 },
  IE: { name: 'Ireland', lat: 53.1424, lng: -7.6921, defaultListings: 4600 },
  NO: { name: 'Norway', lat: 60.4720, lng: 8.4689, defaultListings: 4400 },
  RO: { name: 'Romania', lat: 45.9432, lng: 24.9668, defaultListings: 4200 },
  LT: { name: 'Lithuania', lat: 55.1694, lng: 23.8813, defaultListings: 3950 },
  TH: { name: 'Thailand', lat: 15.8700, lng: 100.9925, defaultListings: 3800 },
  JP: { name: 'Japan', lat: 36.2048, lng: 138.2529, defaultListings: 3650 },
  HK: { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, defaultListings: 3500 },
  NL: { name: 'Netherlands', lat: 52.1326, lng: 5.2913, defaultListings: 3400 },
  BG: { name: 'Bulgaria', lat: 42.7339, lng: 25.4858, defaultListings: 3200 },
  NI: { name: 'Nicaragua', lat: 12.8654, lng: -85.2072, defaultListings: 3100 },
  SV: { name: 'El Salvador', lat: 13.7942, lng: -88.8965, defaultListings: 2950 },
  KE: { name: 'Kenya', lat: -0.0236, lng: 37.9062, defaultListings: 2800 },
  NG: { name: 'Nigeria', lat: 9.0820, lng: 8.6753, defaultListings: 2700 },
  GH: { name: 'Ghana', lat: 7.9465, lng: -1.0232, defaultListings: 2600 },
  AR: { name: 'Argentina', lat: -38.4161, lng: -63.6167, defaultListings: 2500 },
  GT: { name: 'Guatemala', lat: 15.7835, lng: -90.2308, defaultListings: 2400 },
  MA: { name: 'Morocco', lat: 31.7917, lng: -7.0926, defaultListings: 2300 },
  UA: { name: 'Ukraine', lat: 48.3794, lng: 31.1656, defaultListings: 2200 },
  DE: { name: 'Germany', lat: 51.1657, lng: 10.4515, defaultListings: 2150 },
  TN: { name: 'Tunisia', lat: 33.8869, lng: 9.5375, defaultListings: 2050 },
  BO: { name: 'Bolivia', lat: -16.2902, lng: -63.5887, defaultListings: 1950 },
  FI: { name: 'Finland', lat: 61.9241, lng: 25.7482, defaultListings: 1900 },
  KZ: { name: 'Kazakhstan', lat: 48.0196, lng: 66.9237, defaultListings: 1850 },
  BE: { name: 'Belgium', lat: 50.5039, lng: 4.4699, defaultListings: 1800 },
  DK: { name: 'Denmark', lat: 56.2639, lng: 9.5018, defaultListings: 1750 },
  PL: { name: 'Poland', lat: 51.9194, lng: 19.1451, defaultListings: 1700 },
  SK: { name: 'Slovakia', lat: 48.6690, lng: 19.6990, defaultListings: 1650 },
  HN: { name: 'Honduras', lat: 15.2000, lng: -86.2419, defaultListings: 1600 },
  TW: { name: 'Taiwan', lat: 23.6978, lng: 120.9605, defaultListings: 1550 },
  HR: { name: 'Croatia', lat: 45.1000, lng: 15.2000, defaultListings: 1500 },
  HU: { name: 'Hungary', lat: 47.1625, lng: 19.5033, defaultListings: 1450 },
  PK: { name: 'Pakistan', lat: 30.3753, lng: 69.3451, defaultListings: 1400 },
  KR: { name: 'South Korea', lat: 35.9078, lng: 127.7669, defaultListings: 1350 },
  DO: { name: 'Dominican Republic', lat: 18.7357, lng: -70.1627, defaultListings: 1300 },
  VN: { name: 'Vietnam', lat: 14.0583, lng: 108.2772, defaultListings: 1250 },
  BZ: { name: 'Belize', lat: 17.1899, lng: -88.4976, defaultListings: 1200 },
  AU: { name: 'Australia', lat: -25.2744, lng: 133.7751, defaultListings: 1150 },
  IS: { name: 'Iceland', lat: 64.9631, lng: -19.0208, defaultListings: 1100 },
  CA: { name: 'Canada', lat: 56.1304, lng: -106.3468, defaultListings: 1050 },
  BD: { name: 'Bangladesh', lat: 23.6850, lng: 90.3563, defaultListings: 1000 },
  PH: { name: 'Philippines', lat: 12.8797, lng: 121.7740, defaultListings: 950 },
  AT: { name: 'Austria', lat: 47.5162, lng: 14.5501, defaultListings: 900 },
  CH: { name: 'Switzerland', lat: 46.8182, lng: 8.2275, defaultListings: 850 },
  AD: { name: 'Andorra', lat: 42.5063, lng: 1.5218, defaultListings: 800 },
  NZ: { name: 'New Zealand', lat: -40.9006, lng: 174.8860, defaultListings: 750 },
  CN: { name: 'China', lat: 35.8617, lng: 104.1954, defaultListings: 700 },
  SG: { name: 'Singapore', lat: 1.3521, lng: 103.8198, defaultListings: 650 }
};

let cachedBeacons: CountryBeacon[] | null = null;
let lastBeaconFetch = 0;
const BEACON_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches sovereign country beacons joined with live MLS metrics from Untera.
 * Consumes 0 property search quota (uses single /market/scores endpoint).
 */
export async function fetchSovereignBeacons(signal?: AbortSignal): Promise<CountryBeacon[]> {
  const now = Date.now();
  if (cachedBeacons && now - lastBeaconFetch < BEACON_CACHE_TTL) {
    return cachedBeacons;
  }

  const beacons: CountryBeacon[] = [];
  const scoreMap = new Map<string, MarketScore>();

  try {
    const scoresRes = await getMarketScores(signal);
    const results: MarketScore[] = scoresRes?.results || (scoresRes as any)?.data || [];
    for (const r of results) {
      if (r.country) {
        scoreMap.set(r.country.toUpperCase(), r);
      }
    }
  } catch (err) {
    // If network fails, proceed with baseline registry
  }

  for (const [code, meta] of Object.entries(SOVEREIGN_CENTROIDS)) {
    const liveScore = scoreMap.get(code);
    beacons.push({
      country: code,
      countryName: liveScore?.countryName || meta.name,
      latitude: meta.lat,
      longitude: meta.lng,
      listingCount: liveScore?.listingCount || meta.defaultListings,
      score: liveScore?.score || 75,
      grade: liveScore?.grade || 'A',
      ownershipAccess: liveScore?.ownershipAccess,
      affordability: liveScore?.affordability
    });
  }

  // Sort descending by listing volume so major sovereign hubs render prominently
  beacons.sort((a, b) => b.listingCount - a.listingCount);

  cachedBeacons = beacons;
  lastBeaconFetch = now;
  return beacons;
}
