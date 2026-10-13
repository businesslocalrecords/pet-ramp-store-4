/**
 * Dynamic Keyword Insertion (DKI).
 *
 * Reads campaign parameters from the landing page URL so the headline can echo
 * back the exact search term the visitor typed. This raises relevance and
 * conversion because the page visibly matches the ad that was clicked.
 *
 * SECURITY / COMPLIANCE RULE (V3 — read before editing)
 * ---------------------------------------------------
 * Raw URL parameters are NEVER interpolated into the page. The previous
 * version stripped `<>` and control characters and then injected whatever
 * remained into the H1 — that is not a sufficient defense: arbitrary query
 * strings reached the DOM, which is both an XSS vector and an ad-disapproval
 * risk (a crafted ad click could put any text into the headline).
 *
 * Instead, each supported keyword maps to a PRE-WRITTEN headline from the
 * tables below. An ad can choose among a fixed set of approved phrasings; it
 * can never author new ones. Unknown or hostile values fall back to the
 * neutral default, so organic traffic and typo-squatting both see a clean
 * headline rather than leftover template tokens.
 *
 * Supported query params (all whitelisted):
 *   kw_vehicle  -> e.g. "SUV", "Truck", "Minivan"
 *   loc         -> US state or district name, e.g. "Texas"
 *   kw_breed    -> e.g. "Labrador", "Senior Dog"
 *
 * Example (approved values only):
 *   /?kw_vehicle=SUV&loc=Texas
 *   -> "The SUV Dog Ramp / Texas Owners Love"
 */

import { RAMP_SIZES } from './offers';

export interface DkiParams {
  /**
   * Headline phrase, grammatically correct with or without the param.
   *   kw_vehicle=SUV -> "SUV Dog Ramp"
   *   (absent/unknown) -> "Dog Car Ramp"
   */
  vehiclePhrase: string;
  /**
   * Product-block headline — a CPC conversion title that echoes the ad's
   * vehicle keyword and leads with the published Compact rating. The rating
   * number is single-sourced from RAMP_SIZES, never typed here.
   *   kw_vehicle=SUV -> "Foldable Dog Car Ramp for SUVs, Rated to 150 lb"
   *   (absent/unknown) -> "Foldable Dog Car Ramp for SUVs, Rated to 150 lb"
   */
  headline: string;
  /** The plural vehicle noun for the headline, e.g. "SUVs", "Trucks". */
  vehicleFor: string;
  /**
   * Second headline line.
   *   loc=Texas -> "Texas Owners Love"
   *   (absent/unknown) -> "Owners Actually Love"
   */
  locationPhrase: string;
  /**
   * Inline phrase for body copy.
   *   loc=Texas -> "in Texas"
   *   (absent/unknown) -> "in any vehicle"
   */
  locationInline: string;
  /**
   * Breed qualifier for body copy.
   *   kw_breed=Labrador -> "built for Labradors"
   *   (absent/unknown) -> "built for dogs of every size"
   */
  breedPhrase: string;
  /** Vehicle noun for mid-sentence use, e.g. "SUV" or "car or SUV". */
  vehicleInline: string;
  /** True when at least one campaign param produced a personalized phrase. */
  isPersonalized: boolean;
}

/* --------------------------------------------------------------------------
   Whitelists — the ONLY values that can personalize the page.
   Add entries deliberately; each one is pre-written, grammatical copy.
   -------------------------------------------------------------------------- */

/** Vehicle keywords -> headline phrase + mid-sentence noun. */
const VEHICLE_KEYWORDS: Record<string, { phrase: string; inline: string }> = {
  suv: { phrase: 'SUV Dog Ramp', inline: 'SUV' },
  truck: { phrase: 'Truck Dog Ramp', inline: 'truck' },
  pickup: { phrase: 'Pickup Truck Dog Ramp', inline: 'pickup truck' },
  minivan: { phrase: 'Minivan Dog Ramp', inline: 'minivan' },
  van: { phrase: 'Van Dog Ramp', inline: 'van' },
  jeep: { phrase: 'Jeep Dog Ramp', inline: 'Jeep' },
  car: { phrase: 'Car Dog Ramp', inline: 'car' },
  '4x4': { phrase: '4x4 Dog Ramp', inline: '4x4' },
  '4wd': { phrase: '4x4 Dog Ramp', inline: '4x4' },
};

/** Vehicle keywords -> plural vehicle noun used in the product headline. */
const VEHICLE_FOR: Record<string, string> = {
  suv: 'SUVs',
  truck: 'Trucks',
  pickup: 'Pickup Trucks',
  minivan: 'Minivans',
  van: 'Vans',
  jeep: 'Jeeps',
  car: 'Cars',
  '4x4': '4x4s',
  '4wd': '4x4s',
};

/** Breed keywords -> body-copy qualifier. */
const BREED_KEYWORDS: Record<string, string> = {
  labrador: 'built for Labradors',
  'golden retriever': 'built for Golden Retrievers',
  'german shepherd': 'built for German Shepherds',
  corgi: 'built for Corgis',
  'senior dog': 'built for senior dogs',
  'large dog': 'built for large dogs',
};

/** Location keywords: the 50 states plus DC. */
const LOCATION_KEYWORDS: string[] = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  'District of Columbia',
];

/**
 * Normalizes a raw param for lookup: lowercase, trimmed, collapsed spaces,
 * punctuation stripped. This is a LOOKUP KEY ONLY — the normalized value never
 * reaches the DOM, it is only compared against the whitelists above.
 */
function normalize(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || null;
}

/** Case-insensitive lookup against a keyword table. */
function lookup<T>(table: Record<string, T>, value: string | null): T | null {
  const key = normalize(value);
  if (!key) return null;
  return table[key] ?? null;
}

/**
 * Parse DKI values from the current URL. Safe to call in the browser only.
 *
 * Every returned phrase reads correctly when the param is missing or unknown,
 * so organic traffic sees a clean default headline rather than leftover
 * template tokens.
 */
export function readDkiParams(search: string = typeof window !== 'undefined' ? window.location.search : ''): DkiParams {
  const params = new URLSearchParams(search);

  const vehicle = lookup(VEHICLE_KEYWORDS, params.get('kw_vehicle'));
  const vehicleFor = lookup(VEHICLE_FOR, params.get('kw_vehicle')) ?? 'SUVs';
  const breed = lookup(BREED_KEYWORDS, params.get('kw_breed'));

  // Location matches the state list case-insensitively, preserving the
  // list's capitalization ("Texas", not "texas") for display.
  const locationKey = normalize(params.get('loc'));
  const location =
    LOCATION_KEYWORDS.find((name) => name.toLowerCase() === locationKey) ?? null;

  // The rating in the headline is the published Compact figure — the default,
  // most-popular size on this page. Single-sourced from offers.ts.
  const compactRating = RAMP_SIZES[0].weightCapacityLb;

  return {
    vehiclePhrase: vehicle ? vehicle.phrase : 'Dog Car Ramp',
    vehicleFor,
    headline: `Foldable Dog Car Ramp for ${vehicleFor}, Rated to ${compactRating} lb`,
    locationPhrase: location ? `${location} Owners Love` : 'Owners Actually Love',
    locationInline: location ? `in ${location}` : 'in any vehicle',
    breedPhrase: breed ?? 'built for dogs of every size',
    vehicleInline: vehicle ? vehicle.inline : 'car or SUV',
    isPersonalized: Boolean(vehicle || location || breed),
  };
}

/**
 * Query keys that carry ad-campaign context and must be forwarded to the
 * Shopify checkout so attribution survives the cross-domain hop.
 */
const TRACKED_KEYS = ['kw_vehicle', 'loc', 'kw_breed', 'gclid', 'fbclid', 'ttclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

/**
 * Collects every query parameter that must survive the hand-off from this page
 * to the Shopify checkout domain, so attribution is not lost at checkout.
 * Returns a URLSearchParams, empty when nothing needs forwarding.
 */
export function collectAttributionParams(
  search: string = typeof window !== 'undefined' ? window.location.search : ''
): URLSearchParams {
  const params = new URLSearchParams(search);
  const forwarded = new URLSearchParams();
  TRACKED_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value !== null && value !== '') forwarded.set(key, value);
  });
  return forwarded;
}

/**
 * Appends attribution parameters to a Shopify checkout URL.
 * Falls back to the original URL if anything goes wrong.
 */
export function appendAttribution(checkoutUrl: string, forwarded: URLSearchParams): string {
  if (!checkoutUrl || [...forwarded.keys()].length === 0) return checkoutUrl;
  try {
    const url = new URL(checkoutUrl);
    forwarded.forEach((value, key) => {
      // Never overwrite a param Shopify itself set on the checkout URL
      if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    });
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}
