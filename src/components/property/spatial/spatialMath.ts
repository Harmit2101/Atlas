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
  bedroomsLabel: string;
  bathroomsLabel: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  floorCount: number;
  zones: SpatialZone[];
  groundRadius: number;
  boundingRadius: number;
}

/**
 * Normalizes property type string into one of the 6 core architectural massing typologies.
 */
export function resolveTypology(rawType?: string, subtype?: string): SpatialTypology {
  const t = (rawType || '').toLowerCase();
  const s = (subtype || '').toLowerCase();
  const text = `${t} ${s}`;

  if (text.includes('land') || text.includes('lot') || text.includes('plot') || text.includes('terrain')) {
    return 'land';
  }
  if (text.includes('villa') || text.includes('mansion') || text.includes('estate') || text.includes('palace')) {
    return 'villa';
  }
  if (text.includes('house') || text.includes('single') || text.includes('chalet') || text.includes('duplex') || text.includes('townhouse') || text.includes('bungalow') || text.includes('farmhouse')) {
    return 'house';
  }
  if (text.includes('commercial') || text.includes('office') || text.includes('retail') || text.includes('warehouse') || text.includes('industrial')) {
    return 'commercial';
  }
  if (text.includes('apartment') || text.includes('flat') || text.includes('condo') || text.includes('loft') || text.includes('penthouse') || text.includes('studio')) {
    return 'apartment';
  }
  if (t === 'residential') return 'house';

  return 'abstract';
}

/**
 * Computes procedural massing dimensions and conceptual zoning strictly
 * derived from verified property metrics (sqm, beds, baths, typology).
 * Guarantees 100% mathematically valid, clamped, non-NaN values.
 */
export function calculateSpatialEnvelope(property: AtlasProperty): SpatialEnvelopeMetrics {
  const typology = resolveTypology(property.propertyType, `${property.subtitle || ''} ${property.title || ''}`);
  const rawSqm = Number(property.areaSqm);
  const hasVerifiedSqm = Number.isFinite(rawSqm) && rawSqm > 5;

  // Fallback conceptual area if not listed in MLS record
  const effectiveSqm = hasVerifiedSqm
    ? Math.min(Math.max(rawSqm, 20), 3000)
    : Math.max((Number(property.bedrooms) || 2) * 35 + 30, 75);

  const sqmLabel = hasVerifiedSqm
    ? `${Math.round(rawSqm)} m² (${Math.round(rawSqm * 10.764).toLocaleString()} sq ft)`
    : 'AREA NOT DISCLOSED';

  const bedroomsLabel = property.bedrooms > 0
    ? `${property.bedrooms} ${property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}`
    : 'BEDROOMS NOT DISCLOSED';

  const bathroomsLabel = property.bathrooms > 0
    ? `${property.bathrooms} ${property.bathrooms === 1 ? 'Bath' : 'Baths'}`
    : 'BATHROOMS NOT DISCLOSED';

  // Compute spatial scaling factor: visually balanced bounding box
  const baseScale = Math.sqrt(effectiveSqm) * 0.44;
  const clampedScale = Math.min(Math.max(baseScale, 3.2), 6.5);

  let aspect = 1.35;
  if (typology === 'villa') aspect = 1.5;
  else if (typology === 'house') aspect = 1.25;
  else if (typology === 'commercial') aspect = 1.6;
  else if (typology === 'land') aspect = 1.2;

  const width = clampedScale * Math.sqrt(aspect);
  const depth = clampedScale / Math.sqrt(aspect);

  // Derive conceptual floor count without claiming unverified floorplans
  let floorCount = 1;
  if (typology === 'villa' && effectiveSqm > 160) floorCount = 2;
  else if (typology === 'house' && effectiveSqm > 120) floorCount = 2;
  else if (typology === 'commercial' && effectiveSqm > 250) floorCount = 2;

  const heightPerFloor = 1.15;
  const height = typology === 'land' ? 0.2 : floorCount * heightPerFloor;

  // Derive conceptual zones matching actual bedrooms and bathrooms count
  const zones: SpatialZone[] = [];
  const bedCount = Math.min(Math.max(Number(property.bedrooms) || 0, 0), 10);
  const rawBathCount = Math.min(Math.max(Number(property.bathrooms) || 0, 0), 10);
  const fullBathCount = Math.floor(rawBathCount);
  const hasPowderRoom = rawBathCount % 1 >= 0.25;

  if (typology !== 'land') {
    // Primary Living Volume (Center/Core)
    zones.push({
      id: 'core-living',
      label: 'Primary Living & Reception Space',
      position: [0, height * 0.45, 0],
      size: [width * 0.88, height * 0.85, depth * 0.88],
      role: 'living'
    });

    // Conceptual Bedroom Allocations (Proportional spatial zones)
    if (bedCount > 0) {
      const bedCols = Math.min(bedCount, 3);
      const bedWidth = (width * 0.42) / bedCols;
      for (let i = 0; i < bedCount; i++) {
        const col = i % bedCols;
        const xOffset = (col - (bedCols - 1) / 2) * (bedWidth * 1.15);
        const yOffset = floorCount > 1 && i >= Math.ceil(bedCount / 2) ? heightPerFloor : 0;
        zones.push({
          id: `bed-zone-${i + 1}`,
          label: i === 0 ? 'Primary Master Suite Zone' : `Chamber ${i + 1} Zone`,
          position: [xOffset, yOffset + heightPerFloor * 0.48, depth * 0.22],
          size: [Math.max(bedWidth, 0.7), heightPerFloor * 0.72, depth * 0.38],
          role: i === 0 ? 'primary' : 'suite'
        });
      }
    }

    // Conceptual Service / Full Bath Allocations
    if (fullBathCount > 0) {
      for (let j = 0; j < Math.min(fullBathCount, 4); j++) {
        const xSide = j % 2 === 0 ? width * 0.36 : -width * 0.36;
        const yOffset = floorCount > 1 && j >= 2 ? heightPerFloor : 0;
        zones.push({
          id: `bath-zone-${j + 1}`,
          label: j === 0 ? 'Master En-Suite Bath Pod' : `Guest Bath Pod ${j + 1}`,
          position: [xSide, yOffset + heightPerFloor * 0.48, -depth * 0.26],
          size: [Math.max(width * 0.18, 0.5), heightPerFloor * 0.68, Math.max(depth * 0.25, 0.5)],
          role: 'bath'
        });
      }
    }

    // Dedicated Powder Room Pod (0.5 Bath)
    if (hasPowderRoom) {
      zones.push({
        id: 'powder-room-zone',
        label: 'Powder Room Pod (Half Bath)',
        position: [0, heightPerFloor * 0.35, -depth * 0.32],
        size: [Math.max(width * 0.14, 0.45), heightPerFloor * 0.5, Math.max(depth * 0.18, 0.4)],
        role: 'bath'
      });
    }
  } else {
    // Land / Site Contour: ground contour envelope
    zones.push({
      id: 'site-envelope',
      label: 'Survey Boundary Parcel',
      position: [0, 0.05, 0],
      size: [width * 1.15, 0.12, depth * 1.15],
      role: 'open'
    });
  }

  const groundRadius = Math.max(width, depth) * 1.35;
  const boundingRadius = Math.sqrt((width / 2) ** 2 + height ** 2 + (depth / 2) ** 2);

  return {
    typology,
    hasVerifiedSqm,
    effectiveSqm,
    sqmLabel,
    bedroomsLabel,
    bathroomsLabel,
    dimensions: {
      width: Number(width.toFixed(2)),
      height: Number(height.toFixed(2)),
      depth: Number(depth.toFixed(2))
    },
    floorCount,
    zones,
    groundRadius: Number(groundRadius.toFixed(2)),
    boundingRadius: Number(boundingRadius.toFixed(2))
  };
}
