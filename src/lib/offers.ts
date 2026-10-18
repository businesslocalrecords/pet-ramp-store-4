/**
 * Canonical offer + catalog definitions.
 *
 * Pricing is grounded in market research: the reference product
 * (PetSafe Happy Ride Foldable Dog Car Ramp) has an MSRP of $59.99 on
 * PetSafe.com, Amazon and Target. At $129 the offer was more than double
 * the name-brand reference and would lose to Shopping Comparison listings.
 *
 * $79.99 / $139.99 compare-at (43% off) sits ~33% above the reference MSRP,
 * which the PawGrip Tread and 30-day money-back guarantee justify, while
 * leaving ~$40 gross margin for ad spend.
 *
 * PRICE-DISPLAY DECISION (owner override, see claims.md)
 * ------------------------------------------------------
 * The original brief asked to strip all compare-at prices. The owner chose to
 * KEEP them as a subtle anchor: the strikethrough is rendered muted and small
 * (see TieredOfferSelector) so it anchors value without reading like
 * discount-warehouse pricing. Every compare-at here is a real, previously
 * charged price — never an invented one.
 *
 * BUNDLE SAVINGS RULE (owner: honesty over persuasion)
 * ---------------------------------------------------
 * "Save $x vs buying separately" may only be shown when the number is
 * genuinely positive and computed live from the individual item prices
 * (see standaloneTotal / bundleSavings). When a bundle saves nothing, no
 * savings claim renders.
 */

import { GUARANTEE_LABEL } from './policy';
import shopifyCatalog from './bundle-discounts.json';

export const BUNDLE_DISCOUNTS = shopifyCatalog.discounts;

export function getBundleDiscount(tierId: string) {
  if (tierId === 'two' || tierId === 'three') return BUNDLE_DISCOUNTS[tierId];
  return null;
}

export interface OfferTier {
  id: string;
  label: string;
  sublabel: string;
  /** Bundle price. */
  price: number;
  /** Real compare-at price — displayed subtly as a strikethrough anchor. */
  compareAt: number;
  perks: string[];
  /** Whether this tier already includes the traction mat. */
  includesMat: boolean;
  /** Whether this tier includes the car safety tether. */
  includesTether?: boolean;
}

export const TIERS: OfferTier[] = [
  {
    id: 'one',
    label: '1 Ramp',
    sublabel: 'Single vehicle',
    price: 79.99,
    compareAt: 139.99,
    perks: ['Free insured shipping', GUARANTEE_LABEL],
    includesMat: false,
  },
  {
    id: 'two',
    label: '1 Ramp + Traction Mat',
    sublabel: 'The complete setup',
    price: 89.99,
    compareAt: 169.99,
    perks: [
      'Heavy-Duty Traction Mat 2-Pack included',
      'Free insured shipping',
      GUARANTEE_LABEL,
    ],
    includesMat: true,
  },
  {
    id: 'three',
    label: '2 Ramps + Mat + Tether',
    sublabel: 'Two vehicles, fully kitted',
    price: 159.99,
    compareAt: 249.97,
    perks: [
      '2 ramps for two vehicles',
      'Traction Mat 2-Pack + car safety tether',
      'Priority shipping',
      GUARANTEE_LABEL,
    ],
    includesMat: true,
    includesTether: true,
  },
];

/**
 * Default tier shown on load.
 *
 * Owner decision: the default is the single ramp, NOT a bundle. Visitors
 * choose to add; nothing is pre-bundled for them.
 */
export const DEFAULT_TIER_ID = 'one';

/** Returns a tier by id, falling back to the default single ramp. */
export function getTier(id: string): OfferTier {
  return TIERS.find((t) => t.id === id) ?? TIERS[0];
}

/* --------------------------------------------------------------------------
   Money helpers
   -------------------------------------------------------------------------- */

/**
 * Rounds to whole cents.
 *
 * JS float arithmetic makes 139.99 - 79.99 evaluate to 60.000000000000014,
 * which renders verbatim into prices and destroys trust in the offer. Every
 * displayed amount goes through here.
 */
export function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Selling price for a product whose cost is the Chewy listed price.
 * Adds $10 for 25 clicks at 40 cents and $5 for shipping, then rounds up
 * to the next .99.
 */
export function priceFromChewyCost(cost: number): number {
  const sum = money(cost + 15);
  const next = money(Math.floor(sum) + 0.99);
  return next + 0.001 < sum ? money(next + 1) : next;
}

/** Formats as a 2-decimal string, e.g. 79.9 -> "79.90". */
export function formatMoney(value: number): string {
  return money(value).toFixed(2);
}

/* --------------------------------------------------------------------------
   Product identity — used by the buy box, the purchase flow and analytics
   so the same product is named identically everywhere.
   -------------------------------------------------------------------------- */

export const PRODUCT_NAMES = {
  ramp: 'Paw Grip Foldable Dog Car Ramp',
  mat: 'Heavy-Duty Traction Mat (2-Pack)',
  /** Renamed per owner decision; the Shopify handle is unchanged. */
  tether: 'Adjustable Car Safety Tether',
} as const;

/* --------------------------------------------------------------------------
   Add-on pricing
   -------------------------------------------------------------------------- */

/** Add-on prices used by the order bump and the tether upsell. */
export const ADDON_PRICES = {
  tractionMat: 15,
  carTether: 19.99,
} as const;

/** Real compare-at prices for the add-ons (previously charged). */
export const ADDON_COMPARE_AT = {
  tractionMat: 30,
  carTether: 35,
} as const;

/* --------------------------------------------------------------------------
   Honest bundle math
   -------------------------------------------------------------------------- */

/** Price of one ramp on its own — the unit the bundle math is built from. */
export const RAMP_UNIT_PRICE = TIERS[0].price;

/** How many ramps a tier contains. */
function rampCount(tier: OfferTier): number {
  return tier.id === 'three' ? 2 : 1;
}

/** Cost of the same items bought individually, at their stand-alone prices. */
export function standaloneTotal(tier: OfferTier): number {
  return money(
    rampCount(tier) * RAMP_UNIT_PRICE +
      (tier.includesMat ? ADDON_PRICES.tractionMat : 0) +
      (tier.includesTether ? ADDON_PRICES.carTether : 0)
  );
}

/**
 * Money saved by taking the bundle instead of buying the items separately.
 * Returns 0 (never negative) when the bundle saves nothing, so callers can
 * simply check truthiness before rendering a savings claim.
 */
export function bundleSavings(tier: OfferTier): number {
  return money(Math.max(0, standaloneTotal(tier) - tier.price));
}

/* --------------------------------------------------------------------------
   Ramp sizes — the published specification for each configuration.
   The Shopify hero product carries one variant per size (see the seeder);
   RAMP_VARIANT_MATCHERS maps a size to the variant title that fulfils it.
   -------------------------------------------------------------------------- */

export interface RampSize {
  id: 'standard' | 'extended';
  /** Short name used in UI copy. */
  name: string;
  /** Catalog-style name. */
  tierName: string;
  /** Unfolded length in inches — the slope hypotenuse. */
  lengthIn: number;
  widthIn: number;
  foldedIn: number;
  /** Deck thickness in inches (not the cargo height). */
  deckHeightIn: number;
  /** Published weight capacity in pounds. */
  weightCapacityLb: number;
  /**
   * Ramp weight in pounds, or null when the supplier spec sheet has not
   * confirmed it (tracked in LAUNCH_BLOCKERS.md — never guess a weight).
   */
  rampWeightLb: number | null;
  /** Added to the selected bundle price when this size is chosen. */
  priceDelta: number;
  vehicleType: string;
  idealFor: string;
}

export const RAMP_SIZES: RampSize[] = [
  {
    id: 'standard',
    name: 'Compact',
    tierName: 'Standard Compact',
    lengthIn: 62,
    widthIn: 16,
    foldedIn: 31,
    deckHeightIn: 4,
    weightCapacityLb: 150,
    rampWeightLb: 10,
    priceDelta: 0,
    vehicleType: 'Sedans, hatchbacks & compact SUVs',
    idealFor: 'Beagles, French Bulldogs, Border Collies, Spaniels',
  },
  {
    id: 'extended',
    name: 'Extended',
    tierName: 'Heavy-Duty Extended',
    lengthIn: 70,
    widthIn: 18,
    foldedIn: 35,
    deckHeightIn: 4,
    weightCapacityLb: 250,
    rampWeightLb: null,
    priceDelta: 40,
    vehicleType: 'Full-size SUVs, trucks & lifted vehicles',
    idealFor: 'German Shepherds, Golden Retrievers, Mastiffs, Labs',
  },
];

export const DEFAULT_RAMP_SIZE_ID = 'standard';

/** Returns a size by id, falling back to the Compact. */
export function getRampSize(id: string): RampSize {
  return RAMP_SIZES.find((s) => s.id === id) ?? RAMP_SIZES[0];
}

/**
 * Slope angle in degrees for a ramp of `lengthIn` reaching a cargo height of
 * `heightIn`.
 *
 * The ramp's unfolded length is the HYPOTENUSE of the triangle, so the angle
 * is asin(height / length) — not atan. At a 24" cargo height:
 *   Compact  62": asin(24/62) = 22.8°
 *   Extended 70": asin(24/70) = 20.1°
 * (atan would report 21.2° / 18.9° and overstate the steepness.)
 */
export function slopeDeg(heightIn: number, lengthIn: number): number {
  if (lengthIn <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, heightIn / lengthIn));
  return (Math.asin(ratio) * 180) / Math.PI;
}

/**
 * Vehicle height (inches) at or below which the Compact is recommended.
 * Above it the Compact's slope passes ~29°, so the Extended is the honest
 * recommendation even though it costs $40 more.
 */
export const COMPACT_MAX_HEIGHT_IN = 30;

/** Recommended size for a given cargo height, per the published spec. */
export function recommendSize(heightIn: number): RampSize {
  return heightIn <= COMPACT_MAX_HEIGHT_IN ? RAMP_SIZES[0] : RAMP_SIZES[1];
}

/** Maps a size id to the Shopify variant title that fulfils it. */
export const RAMP_VARIANT_MATCHERS: Record<string, RegExp> = {
  standard: /standard|compact|62/i,
  extended: /extended|70/i,
};

/* --------------------------------------------------------------------------
   Shopify product handles — must match the slugs created in Shopify Admin.
   The seeder in scripts/shopify-seed.mjs creates exactly these handles.
   NOTE: the tether's title was renamed to "Adjustable Car Safety Tether"
   but its handle deliberately stays the same so existing cart links,
   the seeder's idempotency and any saved carts keep working.
   -------------------------------------------------------------------------- */
export const PRODUCT_HANDLES = shopifyCatalog.productHandles;

/** Collection handles the storefront can pull from. */
export const COLLECTION_HANDLES = {
  carMobility: 'car-mobility',
  homeMobility: 'home-mobility',
  jointCare: 'joint-care',
  bumps: 'bumps',
} as const;
