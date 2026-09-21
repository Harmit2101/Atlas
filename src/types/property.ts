export type TransactionType = 'sale' | 'rent' | 'auction';

export interface PropertySpec {
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  areaSqM: number;
  lotSizeAcres?: number;
  yearBuilt: number;
}

// Fixture property interface for src/data/properties.ts
export interface Property {
  id: string;
  title: string;
  subtitle: string;
  destinationId: string;
  city: string;
  country: string;
  price: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'AED' | string;
  priceFormatted: string;
  propertyType: string;
  specs: PropertySpec;
  architecturalStyle: string;
  status: string;
  featured: boolean;
  heroImage: string;
  gallery: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  tags: string[];
  description: string;
  curatorNotes: string;
  keyFeatures: string[];
  isSample: true;
}

export type ListingIntent = 'sale' | 'rent' | 'unknown';
export type RentalPeriod = 'day' | 'week' | 'month' | 'year' | 'unknown';

// Normalized Atlas domain model
export interface AtlasProperty {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  priceFormatted: string;
  priceUsd: number;
  currency: string;
  country: string;
  city: string;
  locality?: string;
  region?: string;
  displayLocation?: string;
  address?: string;
  destinationId?: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  transactionType: TransactionType;
  listingIntent: ListingIntent;
  rentalPeriod?: RentalPeriod;
  isHighValueSale: boolean;
  isUltraLuxuryRental: boolean;
  floorPlans: string[];
  spatialSource?: 'room_geometry' | 'floor_plan' | 'metadata_massing' | 'none';
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  areaSqft: number;
  yearBuilt?: number;
  architecturalStyle?: string;
  images: string[];
  imageUrl?: string;
  primaryImage?: string | null;
  videos?: string[];
  virtualTours?: string[];
  features: string[];
  curatorNotes?: string;
  listedAt?: string;
  updatedAt?: string;
  isLive: boolean;
  status?: string;
  featured?: boolean;
}

export interface UnteraRawListing {
  id: string | number;
  source_id?: string;
  source?: string;
  source_name?: string;
  url?: string;
  title?: string;
  description?: string;
  price?: number;
  price_usd?: number;
  original_price?: number | null;
  original_currency?: string | null;
  currency?: string;
  country?: string | null;
  city?: string | null;
  location?: string | null;
  address?: string | null;
  lat?: number;
  latitude?: number | null;
  lng?: number;
  longitude?: number | null;
  property_type?: string;
  property_subtype?: string | null;
  type?: string;
  transaction?: string;
  transaction_type?: string;
  rental_period?: string | null;
  rent_period?: string | null;
  price_period?: string | null;
  period?: string | null;
  frequency?: string | null;
  bedrooms?: number | null;
  beds?: number;
  bathrooms?: number | null;
  baths?: number;
  sqm?: number | null;
  area_sqm?: number;
  area_sqft?: number;
  size?: number;
  year_built?: number;
  images?: string[] | null;
  photos?: string[];
  floor_plans?: string[] | any;
  floorplans?: string[] | any;
  floor_plan?: string | any;
  floorplan?: string | any;
  features?: string[];
  amenities?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UnteraSearchResponse {
  page?: number;
  page_size?: number;
  count?: number;
  total?: number;
  results?: UnteraRawListing[];
  data?: UnteraRawListing[];
  listings?: UnteraRawListing[];
  attribution?: {
    text: string;
    url: string;
  };
}

export interface UnteraSingleListingResponse {
  listing: UnteraRawListing;
  attribution?: {
    text: string;
    url: string;
  };
}

export interface PropertyFilterState {
  country?: string;
  location?: string;
  destinationId?: string;
  propertyType?: string;
  transactionType?: string; // 'sale' | 'rent' | 'all' | ''
  tier?: 'all' | 'high-value-sale' | 'ultra-luxury-rent' | '';
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  bathrooms?: string;
  minSqm?: number;
  maxSqm?: number;
  searchQuery?: string;
  sortBy?: 'featured' | 'price-desc' | 'price-asc' | 'area-desc' | string;
  page?: number;
  pageSize?: number;
}


