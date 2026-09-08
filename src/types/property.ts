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
  address?: string;
  destinationId?: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  transactionType: TransactionType;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  areaSqft: number;
  yearBuilt?: number;
  architecturalStyle?: string;
  images: string[];
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
  source_name?: string;
  url?: string;
  title?: string;
  description?: string;
  price?: number;
  price_usd?: number;
  currency?: string;
  country?: string;
  city?: string;
  address?: string;
  lat?: number;
  latitude?: number;
  lng?: number;
  longitude?: number;
  property_type?: string;
  type?: string;
  transaction_type?: string;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  baths?: number;
  area_sqm?: number;
  area_sqft?: number;
  size?: number;
  year_built?: number;
  images?: string[];
  photos?: string[];
  features?: string[];
  amenities?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UnteraSearchResponse {
  success?: boolean;
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  data?: UnteraRawListing[];
  listings?: UnteraRawListing[];
}

export interface PropertyFilterState {
  country?: string;
  location?: string;
  destinationId?: string;
  propertyType?: string;
  transactionType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  bathrooms?: string;
  searchQuery?: string;
  sortBy?: 'featured' | 'price-desc' | 'price-asc' | 'area-desc';
  page?: number;
}
