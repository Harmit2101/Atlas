import { AtlasProperty } from './property';

export interface DestinationCluster {
  id: string;
  name: string;
  country: string;
  region?: string;
  latitude: number;
  longitude: number;
  propertyCount: number;
  featured: boolean;
  tagline?: string;
  description?: string;
  averagePrice?: string;
  image?: string;
  coordinatesFormatted: string;
  properties?: AtlasProperty[];
}

// Retain Destination alias for backward compatibility
export type Destination = DestinationCluster;
