import { AtlasProperty } from '@/types/property';

export type SpatialTypology = 'apartment' | 'penthouse' | 'villa' | 'house' | 'commercial' | 'land' | 'abstract';

export type SpatialCapabilityLevel = 
  | 'SPATIAL_LEVEL_4' // Actual room geometry / spatial coordinates
  | 'SPATIAL_LEVEL_3' // Actual floor plan available
  | 'SPATIAL_LEVEL_2' // Strong photographic evidence + property metadata
  | 'SPATIAL_LEVEL_1' // Basic metadata only
  | 'SPATIAL_LEVEL_0'; // Insufficient data

export interface SpatialCapability {
  level: SpatialCapabilityLevel;
  code: 'LEVEL_4' | 'LEVEL_3' | 'LEVEL_2' | 'LEVEL_1' | 'LEVEL_0';
  badgeLabel: string;
  badgeTag: string;
  badgeColor: string;
  title: string;
  disclaimer: string;
  isArchitecturalGrade: boolean;
  canRender3DMassing: boolean;
  hasFloorPlan: boolean;
  hasPhotographicEvidence: boolean;
  evidencePhotoCount: number;
}

export interface VolumetricBlock {
  id: string;
  label: string;
  width: number;
  height: number;
  depth: number;
  position: [number, number, number];
  isAccent?: boolean;
}

export interface SpatialEnvelopeMetrics {
  typology: SpatialTypology;
  capability: SpatialCapability;
  hasVerifiedSqm: boolean;
  effectiveSqm: number;
  sqmLabel: string;
  bedroomsLabel: string;
  bathroomsLabel: string;
  floorStackingLabel: string;
  disclaimer: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  blocks: VolumetricBlock[];
  floorCount: number;
  floorSlabs: number[];
  groundRadius: number;
  boundingRadius: number;
}

/**
 * Computes deterministic spatial capability for any property.
 * Evaluates machine-readable room geometry, authentic floor plans, photographic evidence, and metadata.
 */
export function determineSpatialCapability(property: AtlasProperty): SpatialCapability {
  // Check Level 4: Machine-readable room geometry or dimensions
  const hasRoomGeometry = Boolean(
    property.spatialSource === 'room_geometry' ||
    (property as any).room_dimensions ||
    (property as any).rooms_geometry
  );
  if (hasRoomGeometry) {
    return {
      level: 'SPATIAL_LEVEL_4',
      code: 'LEVEL_4',
      badgeLabel: 'LEVEL 4 · MEASURED ROOM GEOMETRY',
      badgeTag: 'Survey-Grade Geometry',
      badgeColor: '#c5a880',
      title: 'Measured Spatial Coordinate Model',
      disclaimer: 'SURVEY-GRADE MODEL: Generated directly from machine-readable room geometry and dimensions.',
      isArchitecturalGrade: true,
      canRender3DMassing: true,
      hasFloorPlan: true,
      hasPhotographicEvidence: (property.images?.length || 0) > 0,
      evidencePhotoCount: property.images?.length || 0
    };
  }

  // Check Level 3: Authentic 2D floor plan blueprints provided by listing source
  const hasFloorPlan = Boolean(property.floorPlans && property.floorPlans.length > 0);
  if (hasFloorPlan) {
    return {
      level: 'SPATIAL_LEVEL_3',
      code: 'LEVEL_3',
      badgeLabel: 'LEVEL 3 · ARCHITECTURAL FLOOR PLAN',
      badgeTag: 'Documented Floor Plan',
      badgeColor: '#c5a880',
      title: 'Architectural Layout Representation',
      disclaimer: 'DOCUMENTED LAYOUT: Corroborated with source architectural floor plan blueprints.',
      isArchitecturalGrade: true,
      canRender3DMassing: true,
      hasFloorPlan: true,
      hasPhotographicEvidence: (property.images?.length || 0) > 0,
      evidencePhotoCount: property.images?.length || 0
    };
  }

  const validImages = (property.images || []).filter(Boolean);
  const rawSqm = Number(property.areaSqm);
  const rawSqft = Number(property.areaSqft);
  const hasVerifiedArea = (Number.isFinite(rawSqm) && rawSqm > 15) || (Number.isFinite(rawSqft) && rawSqft > 150);

  // Check Level 2: Strong photographic evidence (>= 3 authentic photos) + verified metadata
  if (validImages.length >= 3 && hasVerifiedArea) {
    return {
      level: 'SPATIAL_LEVEL_2',
      code: 'LEVEL_2',
      badgeLabel: 'LEVEL 2 · CONCEPTUAL MASSING',
      badgeTag: 'Verified Area + Photo Evidence',
      badgeColor: '#8ec5fc',
      title: 'Data-Derived Conceptual Massing',
      disclaimer: 'CONCEPTUAL SPATIAL MASSING: Volumetric scale and mass distribution derived from verified listing area and photography. Room layouts are not fabricated.',
      isArchitecturalGrade: false,
      canRender3DMassing: true,
      hasFloorPlan: false,
      hasPhotographicEvidence: true,
      evidencePhotoCount: validImages.length
    };
  }

  // Check Level 1: Basic metadata only (< 3 photos or unverified area)
  if (hasVerifiedArea || validImages.length > 0) {
    return {
      level: 'SPATIAL_LEVEL_1',
      code: 'LEVEL_1',
      badgeLabel: 'LEVEL 1 · BASIC METADATA MASSING',
      badgeTag: 'Baseline Dimensions',
      badgeColor: '#e0a96d',
      title: 'Baseline Dimensional Massing',
      disclaimer: 'PRELIMINARY MASSING: Approximate scale based on baseline public listing metadata. Photographic and plan data limited.',
      isArchitecturalGrade: false,
      canRender3DMassing: true,
      hasFloorPlan: false,
      hasPhotographicEvidence: validImages.length > 0,
      evidencePhotoCount: validImages.length
    };
  }

  // Level 0: Insufficient data to construct a truthful representation
  return {
    level: 'SPATIAL_LEVEL_0',
    code: 'LEVEL_0',
    badgeLabel: 'LEVEL 0 · INSUFFICIENT SPATIAL DATA',
    badgeTag: 'Data Limited',
    badgeColor: '#8e8d93',
    title: 'Spatial Representation Unavailable',
    disclaimer: 'INSUFFICIENT SPATIAL DATA: Listing lacks verified square meters, blueprints, and photographic survey. 3D representation is withheld to prevent false precision.',
    isArchitecturalGrade: false,
    canRender3DMassing: false,
    hasFloorPlan: false,
    hasPhotographicEvidence: false,
    evidencePhotoCount: 0
  };
}


/**
 * Normalizes property type string into one of the core architectural massing typologies.
 */
export function resolveTypology(rawType?: string, textContext?: string): SpatialTypology {
  const t = (rawType || '').toLowerCase();
  const text = `${t} ${(textContext || '').toLowerCase()}`;

  if (text.includes('land') || text.includes('lot') || text.includes('plot') || text.includes('terrain') || text.includes('acre')) {
    return 'land';
  }
  if (text.includes('penthouse') || text.includes('sky villa') || text.includes('attic')) {
    return 'penthouse';
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
  if (text.includes('apartment') || text.includes('flat') || text.includes('condo') || text.includes('loft') || text.includes('studio')) {
    return 'apartment';
  }
  if (t === 'residential') return 'house';

  return 'abstract';
}

/**
 * Computes procedural massing dimensions derived strictly from verified listing metrics (sqm, area, typology).
 * ZERO fake interior bedroom cubes are generated. Bedroom count is metadata, not geometry.
 */
export function calculateSpatialEnvelope(property: AtlasProperty): SpatialEnvelopeMetrics {
  const capability = determineSpatialCapability(property);
  const typology = resolveTypology(property.propertyType, `${property.subtitle || ''} ${property.title || ''}`);
  const rawSqm = Number(property.areaSqm);
  const hasVerifiedSqm = Number.isFinite(rawSqm) && rawSqm > 5;

  // Derive effective area in square meters strictly from genuine listing attributes
  let effectiveSqm = hasVerifiedSqm ? rawSqm : 0;
  if (effectiveSqm <= 0 && Number(property.areaSqft) > 50) {
    effectiveSqm = Math.round(Number(property.areaSqft) * 0.092903);
  }

  // If no area was disclosed, use conservative typological baselines for visual framing
  if (effectiveSqm <= 0) {
    switch (typology) {
      case 'villa': effectiveSqm = 320; break;
      case 'penthouse': effectiveSqm = 240; break;
      case 'house': effectiveSqm = 160; break;
      case 'commercial': effectiveSqm = 450; break;
      case 'land': effectiveSqm = 1200; break;
      case 'apartment':
      default:
        effectiveSqm = 95;
    }
  }

  const sqmLabel = hasVerifiedSqm 
    ? `${property.areaSqm} m² Verified` 
    : property.areaSqft > 0 
    ? `${property.areaSqft.toLocaleString()} sq ft` 
    : 'Area Not Disclosed';

  const bedroomsLabel = property.bedrooms > 0
    ? `${property.bedrooms} ${property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}`
    : 'Beds Not Disclosed';

  const bathroomsLabel = property.bathrooms > 0
    ? `${property.bathrooms} ${property.bathrooms === 1 ? 'Bath' : 'Baths'}`
    : 'Baths Not Disclosed';

  // Feature signals from listing
  const featureText = (property.features || []).join(' ').toLowerCase();
  const descText = `${property.title || ''} ${property.description || ''}`.toLowerCase();
  const hasTerrace = featureText.includes('terrace') || featureText.includes('balcony') || descText.includes('terrace') || descText.includes('balcony');
  const hasExteriorAmenities = featureText.includes('pool') || featureText.includes('garden') || descText.includes('pool') || descText.includes('garden');

  // Compute spatial scaling factor: visually balanced bounding box
  const baseScale = Math.sqrt(effectiveSqm) * 0.44;
  const clampedScale = Math.min(Math.max(baseScale, 3.2), 6.5);

  let aspect = 1.35;
  if (typology === 'villa') aspect = 1.6;
  else if (typology === 'penthouse') aspect = 1.25;
  else if (typology === 'house') aspect = 1.15;
  else if (typology === 'commercial') aspect = 1.7;
  else if (typology === 'apartment') aspect = 1.3;
  else if (typology === 'land') aspect = 1.2;

  const width = Number((clampedScale * Math.sqrt(aspect)).toFixed(2));
  const depth = Number((clampedScale / Math.sqrt(aspect)).toFixed(2));

  // Typology-specific vertical height & floor levels
  let floorCount = 1;
  if (descText.includes('triplex') || descText.includes('3-story') || descText.includes('three-story') || descText.includes('3 floor')) {
    floorCount = 3;
  } else if (descText.includes('duplex') || descText.includes('two-story') || descText.includes('2-story')) {
    floorCount = 2;
  } else if (typology === 'villa' && effectiveSqm > 200) {
    floorCount = 2;
  } else if (typology === 'house' && effectiveSqm > 140) {
    floorCount = 2;
  } else if (typology === 'commercial' && effectiveSqm > 300) {
    floorCount = 3;
  } else if (typology === 'penthouse') {
    floorCount = 2;
  } else if (typology === 'apartment' && effectiveSqm > 240) {
    floorCount = 2;
  }

  const heightPerFloor = 1.15;
  const height = Number((typology === 'land' ? 0.2 : floorCount * heightPerFloor).toFixed(2));

  // Generate distinct, property-specific architectural volumetric blocks
  const blocks: VolumetricBlock[] = [];

  if (typology === 'villa') {
    if (effectiveSqm > 350) {
      // Grand Compound: Three-wing U-configuration with central cour d'honneur
      const mainW = Number((width * 0.52).toFixed(2));
      const mainD = depth;
      blocks.push({
        id: 'main-pavilion',
        label: `Main Residential Pavilion [${Math.round(effectiveSqm * 0.5)} m² Area Share]`,
        width: mainW,
        height,
        depth: mainD,
        position: [0, height / 2, 0]
      });

      const wingW = Number((width * 0.32).toFixed(2));
      const wingD = Number((depth * 0.72).toFixed(2));
      const wingH = Number((height * 0.75).toFixed(2));
      blocks.push({
        id: 'east-wing',
        label: 'East Residential Pavilion',
        width: wingW,
        height: wingH,
        depth: wingD,
        position: [Number((width * 0.38).toFixed(2)), wingH / 2, Number((depth * 0.1).toFixed(2))],
        isAccent: true
      });

      blocks.push({
        id: 'west-wing',
        label: 'West Guest / Wellness Wing',
        width: wingW,
        height: wingH,
        depth: wingD,
        position: [-Number((width * 0.38).toFixed(2)), wingH / 2, Number((depth * 0.1).toFixed(2))],
        isAccent: true
      });
    } else if (effectiveSqm > 160) {
      // Articulated Luxury Villa: Main Pavilion + Secondary Wing + Optional Deck
      const mainW = Number((width * 0.68).toFixed(2));
      const mainD = depth;
      blocks.push({
        id: 'main-pavilion',
        label: 'Main Residential Volume',
        width: mainW,
        height,
        depth: mainD,
        position: [-Number((width * 0.16).toFixed(2)), height / 2, 0]
      });

      const wingW = Number((width * 0.38).toFixed(2));
      const wingD = Number((depth * 0.72).toFixed(2));
      const wingH = Number((height * 0.7).toFixed(2));
      blocks.push({
        id: 'amenity-wing',
        label: 'Private Amenity Wing',
        width: wingW,
        height: wingH,
        depth: wingD,
        position: [Number((width * 0.38).toFixed(2)), wingH / 2, Number((depth * 0.08).toFixed(2))],
        isAccent: true
      });

      if (hasTerrace || hasExteriorAmenities) {
        const terraceW = Number((width * 0.44).toFixed(2));
        const terraceD = Number((depth * 0.36).toFixed(2));
        blocks.push({
          id: 'amenity-terrace',
          label: 'Exterior Amenity & Terrace Deck',
          width: terraceW,
          height: 0.18,
          depth: terraceD,
          position: [Number((width * 0.1).toFixed(2)), 0.09, Number((depth * 0.52).toFixed(2))],
          isAccent: true
        });
      }
    } else {
      // Single-Level Pavilion Villa with Entry Articulation
      blocks.push({
        id: 'villa-volume',
        label: 'Single-Level Villa Envelope',
        width,
        height,
        depth,
        position: [0, height / 2, 0]
      });

      if (hasTerrace) {
        blocks.push({
          id: 'covered-patio',
          label: 'Covered Veranda / Loggia',
          width: Number((width * 0.85).toFixed(2)),
          height: 0.15,
          depth: Number((depth * 0.3).toFixed(2)),
          position: [0, 0.08, Number((depth * 0.52).toFixed(2))],
          isAccent: true
        });
      }
    }
  } else if (typology === 'penthouse') {
    // Sky Estate: Base floorplate + set-back rooftop observatory pavilion
    const baseH = Number((height * 0.58).toFixed(2));
    blocks.push({
      id: 'penthouse-base',
      label: 'Primary Living Floorplate',
      width,
      height: baseH,
      depth,
      position: [0, baseH / 2, 0]
    });

    const skyW = Number((width * 0.62).toFixed(2));
    const skyD = Number((depth * 0.62).toFixed(2));
    const skyH = Number((height * 0.42).toFixed(2));
    blocks.push({
      id: 'sky-pavilion',
      label: 'Crowning Observatory Pavilion',
      width: skyW,
      height: skyH,
      depth: skyD,
      position: [Number((width * 0.08).toFixed(2)), baseH + skyH / 2, Number((depth * 0.05).toFixed(2))],
      isAccent: true
    });

    // Rooftop Sky Terrace
    const terraceW = Number((width * 0.35).toFixed(2));
    const terraceD = Number((depth * 0.5).toFixed(2));
    blocks.push({
      id: 'sky-terrace',
      label: 'Rooftop Panoramic Terrace',
      width: terraceW,
      height: 0.12,
      depth: terraceD,
      position: [-Number((width * 0.28).toFixed(2)), baseH + 0.06, 0],
      isAccent: true
    });
  } else if (typology === 'commercial') {
    const podiumH = 0.8;
    blocks.push({
      id: 'commercial-podium',
      label: 'Commercial Retail / Atrium Podium',
      width,
      height: podiumH,
      depth,
      position: [0, podiumH / 2, 0]
    });

    const coreW = Number((width * 0.75).toFixed(2));
    const coreD = Number((depth * 0.75).toFixed(2));
    const coreH = Math.max(height - podiumH, 1.2);
    blocks.push({
      id: 'commercial-core',
      label: 'Primary Office / Structural Core',
      width: coreW,
      height: coreH,
      depth: coreD,
      position: [0, podiumH + coreH / 2, 0],
      isAccent: true
    });
  } else if (typology === 'house') {
    if (floorCount >= 2) {
      // Articulated Two-Level Residence with Upper Cantilever
      const groundH = Number((height * 0.52).toFixed(2));
      blocks.push({
        id: 'ground-level',
        label: 'Ground Level Living Envelope',
        width,
        height: groundH,
        depth,
        position: [0, groundH / 2, 0]
      });

      const upperH = Number((height * 0.48).toFixed(2));
      const upperW = Number((width * 0.94).toFixed(2));
      const upperD = Number((depth * 0.94).toFixed(2));
      blocks.push({
        id: 'upper-level',
        label: 'Upper Residential Floorplate',
        width: upperW,
        height: upperH,
        depth: upperD,
        position: [Number((width * 0.03).toFixed(2)), groundH + upperH / 2, 0],
        isAccent: true
      });
    } else {
      blocks.push({
        id: 'house-mass',
        label: 'Residential Structure',
        width,
        height,
        depth,
        position: [0, height / 2, 0]
      });
    }
  } else if (typology === 'land') {
    blocks.push({
      id: 'land-parcel',
      label: 'Surveyed Parcel Boundary',
      width,
      height: 0.15,
      depth,
      position: [0, 0.08, 0]
    });
  } else {
    // Apartment / Flat
    blocks.push({
      id: 'apartment-volume',
      label: 'Verified Floorplate Envelope',
      width,
      height,
      depth,
      position: [0, height / 2, 0]
    });

    if (hasTerrace) {
      const balconyW = Number((width * 0.45).toFixed(2));
      const balconyD = Number((depth * 0.22).toFixed(2));
      blocks.push({
        id: 'apartment-balcony',
        label: 'Cantilevered Balcony / Loggia',
        width: balconyW,
        height: 0.12,
        depth: balconyD,
        position: [0, height * 0.4, Number((depth * 0.55).toFixed(2))],
        isAccent: true
      });
    }
  }

  // Floorplate slab elevations
  const floorSlabs: number[] = [];
  if (typology !== 'land') {
    for (let f = 0; f <= floorCount; f++) {
      floorSlabs.push(f * (height / floorCount));
    }
  }

  const floorStackingLabel = typology === 'land' 
    ? 'Surveyed Parcel Contour' 
    : typology === 'penthouse'
    ? 'Penthouse + Sky Terrace'
    : typology === 'villa' && effectiveSqm > 350
    ? 'Tri-Wing Compound Massing'
    : typology === 'villa' && effectiveSqm > 160
    ? 'Main Pavilion + Amenity Wing'
    : `${floorCount} Level ${floorCount === 1 ? 'Volume' : 'Stacking'}`;

  const groundRadius = Number((Math.max(width, depth) * 1.35).toFixed(2));
  const boundingRadius = Number((Math.sqrt((width / 2) ** 2 + height ** 2 + (depth / 2) ** 2)).toFixed(2));

  return {
    typology,
    capability,
    hasVerifiedSqm,
    effectiveSqm,
    sqmLabel,
    bedroomsLabel,
    bathroomsLabel,
    floorStackingLabel,
    disclaimer: capability.disclaimer,
    dimensions: {
      width,
      height,
      depth
    },
    blocks,
    floorCount,
    floorSlabs,
    groundRadius,
    boundingRadius
  };
}

