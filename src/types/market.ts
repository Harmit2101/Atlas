export interface MarketScore {
  country: string;
  countryName: string;
  score: number;
  grade: string;
  ownershipAccess: string;
  affordability: string;
  purchaseCosts: string;
  residencyScore: string;
  dataConfidence: string;
  listingCount: number;
}

export interface MarketScoresResponse {
  count: number;
  methodology?: string;
  results: MarketScore[];
  attribution: {
    text: string;
    url: string;
  };
}

export interface UnteraStats {
  listings: number;
  sources: number;
  countries: number;
  attribution: {
    text: string;
    url: string;
  };
}

export interface UnteraSource {
  source: string;
  country: string;
  listings: number;
}

export interface UnteraSourcesResponse {
  count: number;
  results: UnteraSource[];
  attribution: {
    text: string;
    url: string;
  };
}
