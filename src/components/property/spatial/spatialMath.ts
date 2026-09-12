import { AtlasProperty } from '@/types/property';

export type SpatialTypology = 'apartment' | 'villa' | 'house' | 'commercial' | 'land' | 'abstract';

export interface SpatialZone {
  id: string;
  label: string;
  position: [number, number, number];
  size: [number, number, number];
  role: 'primary' | 'living' | 'suite' | 'bath' | 'terrace' | 'open';
}

export interface SpatialEnvelopeMetrics {
  typology: SpatialTypology;
  hasVerifiedSqm: boolean;
  effectiveSqm: number;
  sqmLabel: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  floorCount: number;
  zones: SpatialZone[];
  groundRadius: number;
}

/**
 * Resolves normalized typology classification from listing types/subtypes.
 */
export function resolveTypology(type?: string, subtype?: string | null): SpatialTypology {
  const t = (type || '').toLowerCase();
  const st = (subtype || '').toLowerCase();

  if (t === 'land' || st === 'land' || st === 'plot') return 'land';
  if (t === 'commercial' || st === 'commercial' || st === 'office' || st === 'retail') return 'commercial';
  if (st.includes('villa') || st.includes('mansion') || st.includes('estate')) return 'villa';
  if (st.includes('house') || st.includes('chalet') || st.includes('farmhouse') || st.includes('cottage')) return 'house';
  if (st.includes('apartment') || st.includes('condo') || st.includes('penthouse') || st.includes('flat') || st.includes('loft') || st.includes('studio')) return 'apartment';
  if (t === 'residential') return 'apartment';

  return 'abstract';
}

/**
 * Computes procedural massing dimensions and conceptual zoning strictly
 * derived from verified property metrics (sqm, beds, baths, typology).
 * Guarantees 100% mathematically valid, clamped, non-NaN values.
 */
export function calculateSpatialEnvelope(property: AtlasProperty): SpatialEnvelopeMetrics {
  const typology = resolveTypology(property.propertyType, property.subtitle || property.propertyType);
  const rawSqm = Number(property.areaSqm);
  const hasVerifiedSqm = Number.isFinite(rawSqm) && rawSqm > 5;

  // Fallback conceptual area if not listed in MLS record
  const effectiveSqm = hasVerifiedSqm
    ? Math.min(Math.max(rawSqm, 15), 3000)
    : Math.max((Number(property.bedrooms) || 2) * 35 + 25, 60);

  const sqmLabel = hasVerifiedSqm
    ? `${Math.round(rawSqm)} m² (${Math.round(rawSqm * 10.764).toLocaleString()} sq ft)`
    : 'Estimated Typological Scale';

  // Compute spatial scaling factor: 100 sqm -> approx 4.0 x 3.0 world units
  // Using an architectural aspect ratio of ~ 1.33:1 to 1.5:1
  const baseScale = Math.sqrt(effectiveSqm) * 0.42;
  const clampedScale = Math.min(Math.max(baseScale, 1.8), 7.5);

  let aspect = 1.35;
  if (typology === 'villa') aspect = 1.55;
  else if (typology === 'house') aspect = 1.25;
  else if (typology === 'commercial') aspect = 1.6;
  else if (typology === 'land') aspect = 1.2;

  const width = clampedScale * Math.sqrt(aspect);
  const depth = clampedScale / Math.sqrt(aspect);

  // Derive conceptual floor count without claiming unverified floorplans
  let floorCount = 1;
  if (typology === 'villa' && effectiveSqm > 180) floorCount = 2;
  else if (typology === 'house' && effectiveSqm > 140) floorCount = 2;
  else if (typology === 'commercial' && effectiveSqm > 300) floorCount = 2;

  const heightPerFloor = 0.85;
  const height = floorCount * heightPerFloor;

  // Derive conceptual zones matching actual bedrooms and bathrooms count
  const zones: SpatialZone[] = [];
  const bedCount = Math.min(Math.max(Number(property.bedrooms) || 0, 0), 8);
  const bathCount = Math.min(Math.max(Number(property.bathrooms) || 0, 0), 6);

  if (typology !== 'land') {
    // Primary Living Volume (Center/Core)
    zones.push({
      id: 'core-living',
      label: 'Primary Living Volume',
      position: [0, height * 0.5, 0],
      size: [width * 0.92, height * 0.92, depth * 0.92],
      role: 'living'
    });

    // Conceptual Bedroom Allocations (Proportional spatial zones)
    if (bedCount > 0) {
      const bedWidth = (width * 0.35) / Math.min(bedCount, 3);
      for (let i = 0; i < bedCount; i++) {
        const xOffset = ((i % 3) - 1) * (bedWidth * 1.1);
        const yOffset = floorCount > 1 && i >= Math.ceil(bedCount / 2) ? heightPerFloor : 0;
        zones.push({
          id: `bed-zone-${i + 1}`,
          label: i === 0 ? 'Primary Suite Zone' : `Chamber ${i + 1} Zone`,
          position: [xOffset, yOffset + heightPerFloor * 0.5, depth * 0.22],
          size: [Math.max(bedWidth, 0.6), heightPerFloor * 0.7, depth * 0.35],
          role: i === 0 ? 'primary' : 'suite'
        });
      }
    }

    // Conceptual Service / Bath Allocations
    if (bathCount > 0) {
      for (let j = 0; j < Math.min(bathCount, 4); j++) {
        const xSide = j % 2 === 0 ? width * 0.38 : -width * 0.38;
        const yOffset = floorCount > 1 && j >= 2 ? heightPerFloor : 0;
        zones.push({
          id: `bath-zone-${j + 1}`,
          label: `Service Zone ${j + 1}`,
          position: [xSide, yOffset + heightPerFloor * 0.5, -depth * 0.25],
          size: [Math.max(width * 0.16, 0.4), heightPerFloor * 0.65, Math.max(depth * 0.22, 0.4)],
          role: 'bath'
        });
      }
    }
  } else {
    // Land / Site Contour: ground contour envelope
    zones.push({
      id: 'site-envelope',
      label: 'Site Boundary Envelope',
      position: [0, 0.05, 0],
      size: [width * 1.1, 0.1, depth * 1.1],
      role: 'open'
    });
  }

  const groundRadius = Math.max(width, depth) * 1.25;

  return {
    typology,
    hasVerifiedSqm,
    effectiveSqm,
    sqmLabel,
    dimensions: {
      width: Number(width.toFixed(2)),
      height: Number(height.toFixed(2)),
      depth: Number(depth.toFixed(2))
    },
    floorCount,
    zones,
    groundRadius: Number(groundRadius.toFixed(2))
  };
}
