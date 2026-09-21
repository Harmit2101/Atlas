import { AtlasProperty, ListingIntent, RentalPeriod } from '@/types/property';

/**
 * ATLAS COMMERCIAL INVENTORY THRESHOLDS
 * 
 * Defined according to Atlas Commercial Platform Standards:
 * - Minimum Qualifying Sale Price: USD $300,000 equivalent
 * - Minimum Qualifying Daily Rent: USD $5,000 equivalent
 * 
 * Centralized here to guarantee that UI components never hardcode disparate rules.
 */
export const MIN_QUALIFYING_SALE_USD = 300_000;
export const MIN_QUALIFYING_DAILY_RENT_USD = 5_000;

/**
 * Documented institutional baseline FX reference rates for major international territories.
 * Used strictly for commercial qualification when Untera does not provide direct price_usd.
 * Obscure or unsupported currencies remain UNVERIFIED and are excluded from qualification.
 */
export const INSTITUTIONAL_BASELINE_FX: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.28,
  CAD: 0.74,
  AED: 0.272,
  CHF: 1.12,
  JPY: 0.0067,
  AUD: 0.65
};

export interface UsdValuationResult {
  priceUsd: number;
  isVerified: boolean;
  conversionSource: 'usd_direct' | 'provider_converted' | 'institutional_baseline' | 'unverified';
}

/**
 * Resolves USD equivalent price safely without inventing arbitrary exchange rates.
 * Foreign currencies with no verified rate remain unverified and do not qualify.
 */
export function resolveUsdValuation(
  price: number,
  currency: string = 'USD',
  rawPriceUsd?: number | null
): UsdValuationResult {
  const cleanCurr = (currency || '').trim().toUpperCase();

  // 1. Direct USD evaluation
  if (cleanCurr === 'USD') {
    return {
      priceUsd: price,
      isVerified: Number.isFinite(price) && price > 0,
      conversionSource: 'usd_direct'
    };
  }

  // 2. Direct provider-supplied conversion from Untera MLS payload
  if (rawPriceUsd != null && Number.isFinite(Number(rawPriceUsd)) && Number(rawPriceUsd) > 0) {
    return {
      priceUsd: Number(rawPriceUsd),
      isVerified: true,
      conversionSource: 'provider_converted'
    };
  }

  // 3. Known institutional benchmark baseline
  const rate = INSTITUTIONAL_BASELINE_FX[cleanCurr];
  if (rate && Number.isFinite(price) && price > 0) {
    return {
      priceUsd: Math.round(price * rate),
      isVerified: true,
      conversionSource: 'institutional_baseline'
    };
  }

  // 4. Unsupported or missing currency: Unverified
  return {
    priceUsd: 0,
    isVerified: false,
    conversionSource: 'unverified'
  };
}

/**
 * Validates whether a property qualifies as a HIGH-VALUE SALE asset.
 * 
 * Rules:
 * 1. Must have listingIntent === 'sale' (or transactionType === 'sale')
 * 2. Must have verified USD valuation >= $300,000.
 * 3. If currency is unknown or unsupported, qualification is unverified and returns false.
 */
export function isHighValueSale(property: Pick<AtlasProperty, 'listingIntent' | 'transactionType' | 'priceUsd' | 'price' | 'currency'>): boolean {
  const isSale = property.listingIntent === 'sale' || property.transactionType === 'sale';
  if (!isSale) return false;

  const valuation = resolveUsdValuation(property.price, property.currency, property.priceUsd);
  if (!valuation.isVerified || valuation.priceUsd <= 0) return false;

  return valuation.priceUsd >= MIN_QUALIFYING_SALE_USD;
}

/**
 * Validates whether a property qualifies as an ULTRA-LUXURY RENTAL asset.
 * 
 * Rules:
 * 1. Must have listingIntent === 'rent' (or transactionType === 'rent')
 * 2. Rental period MUST explicitly be daily ('day').
 *    CRITICAL: A rental of $5,000/month or $5,000/week is NOT $5,000/day.
 * 3. Daily rate in USD equivalent MUST be >= $5,000.
 * 4. If rental period is unknown or monthly, it does NOT qualify for the $5k/day threshold.
 */
export function isUltraLuxuryRental(property: Pick<AtlasProperty, 'listingIntent' | 'transactionType' | 'rentalPeriod' | 'priceUsd' | 'price' | 'currency'>): boolean {
  const isRent = property.listingIntent === 'rent' || property.transactionType === 'rent';
  if (!isRent) return false;

  // Only qualify if period is explicitly 'day'
  if (property.rentalPeriod !== 'day') {
    return false;
  }

  const valuation = resolveUsdValuation(property.price, property.currency, property.priceUsd);
  if (!valuation.isVerified || valuation.priceUsd <= 0) return false;

  return valuation.priceUsd >= MIN_QUALIFYING_DAILY_RENT_USD;
}

/**
 * Returns clean human-readable rental period label.
 * If rental period is unknown, explicitly states it is not disclosed.
 */
export function getRentalPeriodLabel(period?: RentalPeriod): string {
  switch (period) {
    case 'day':
      return '/ DAY';
    case 'week':
      return '/ WEEK';
    case 'month':
      return '/ MONTH';
    case 'year':
      return '/ YEAR';
    case 'unknown':
      return '(Rental period not disclosed)';
    default:
      return '';
  }
}

export interface FormattedPriceResult {
  amount: string;
  periodLabel: string;
  intentBadgeText: 'FOR SALE' | 'FOR RENT' | 'VERIFIED ASSET';
  intentColor: 'gold' | 'blue' | 'neutral';
  tierBadgeText?: string;
  isDailyRent: boolean;
}

/**
 * Formats property price strictly honoring source currency, rental period, and commercial tier.
 * Never fabricates numbers, exchange rates, or periods.
 */
export function formatPropertyPriceWithIntent(property: AtlasProperty): FormattedPriceResult {
  const isRent = property.listingIntent === 'rent' || property.transactionType === 'rent';
  const isSale = property.listingIntent === 'sale' || property.transactionType === 'sale';

  const periodLabel = isRent ? getRentalPeriodLabel(property.rentalPeriod) : '';
  const isDailyRent = isRent && property.rentalPeriod === 'day';

  let tierBadgeText: string | undefined;
  if (property.isHighValueSale) {
    tierBadgeText = 'COLLECTION $300K+';
  } else if (property.isUltraLuxuryRental) {
    tierBadgeText = 'ULTRA-LUXURY $5K+/DAY';
  }

  return {
    amount: property.priceFormatted || 'Price on Inquiry',
    periodLabel,
    intentBadgeText: isRent ? 'FOR RENT' : isSale ? 'FOR SALE' : 'VERIFIED ASSET',
    intentColor: isRent ? 'blue' : isSale ? 'gold' : 'neutral',
    tierBadgeText,
    isDailyRent
  };
}
