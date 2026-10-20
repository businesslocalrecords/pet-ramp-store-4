/**
 * Central registry for static assets, content gates and business identity.
 *
 * WHY THIS FILE EXISTS
 * -------------------
 * The storefront must ship without any fabricated content. Sections that need
 * real owner-supplied material (demo video, owner clips, buyer reviews,
 * founder note) are behind explicit boolean gates that default to OFF. With a
 * gate off the section renders nothing — an inert slot, not fake content.
 *
 * ASSET GATE PATTERN
 * ------------------
 *   1. Add a `GATES.<name>` flag here (default false).
 *   2. In the component: `if (!GATES.<name>) return null;`
 *   3. In pages/index.tsx: `{GATES.<name> && <Suspense ...><Component /></Suspense>}`
 *      so a disabled section does not even download its lazy chunk.
 *   4. When the real asset lands: drop it in public/assets/, flip the flag,
 *      and cross the item off LAUNCH_BLOCKERS.md.
 */

/* --------------------------------------------------------------------------
   Static assets. The flagship ramp gallery is ASSETS.heroPhotos — the
   owner's photo set — and the SVGs remain the fallback for accessories
   that do not have a manufacturer photograph. New test-catalog products
   use manufacturer photos under public/assets/catalog/.
   -------------------------------------------------------------------------- */

export const ASSETS = {
  /** Product renderings, one per ramp configuration. Fallback gallery frames
      now that ASSETS.heroPhotos leads the hero. */
  product: {
    standard: '/assets/product/ramp-compact.svg',
    extended: '/assets/product/ramp-extended.svg',
  },
  /** Trust badges drawn in-house (no third-party endorsement marks). */
  badges: {
    guarantee: '/assets/badges/30-day-guarantee.svg',
    shipping: '/assets/badges/free-shipping.svg',
    secureCheckout: '/assets/badges/secure-checkout.svg',
  },
  /**
   * Owner-supplied photography for the hero gallery — the grit-deck set from
   * more-pics-for-site/ (1–8), installed under public/assets/product/grit/.
   * Three frames come from the earlier revised/ set by owner choice: the man
   * carrying the folded ramp and the two white-background studio shots.
   *
   * Order: dogs walking into vehicles first (the ad's promise), then the
   * Paw Grip deck close-up, other vehicles, the fold, the readable specs
   * card, then the studio shots. The brand poster
   * (grit/pawgrip-pro-poster.jpg) is kept for social ads only: it shows a
   * house pet door, not a car.
   *
   * Every photo file is a 1400×1400 square, the same canvas as the catalog
   * shots. The gallery frame is square. `fit: 'contain'` keeps a studio
   * shot from being cropped.
   *
   * `vehicles` lists the whitelisted kw_vehicle keys (lib/dki.ts) a photo
   * matches; a matching photo is moved to the front, nothing is hidden.
   */
  heroPhotos: [
    {
      src: '/assets/product/grit/ramp-german-shepherd-suv.jpg?v=2',
      alt:
        'A German Shepherd walking up the Paw Grip grit-deck ramp into the cargo area of a blue SUV',
      label: 'Walks right in',
      vehicles: ['suv', 'jeep', '4x4', '4wd'],
    },
    {
      src: '/assets/product/grit/ramp-white-dog-walking-up-suv.jpg?v=2',
      alt:
        'A large white dog walking up the Paw Grip grit-deck ramp into a white SUV',
      label: 'No more lifting',
      vehicles: ['suv'],
    },
    {
      src: '/assets/product/grit/ramp-grit-deck-tailgate.jpg',
      alt:
        'Close view of the Paw Grip ramp at the tailgate of a white SUV, showing the grit walking surface, side rails and center hinge',
      label: 'Paw Grip deck',
    },
    {
      src: '/assets/product/grit/ramp-boxer-hatchback.jpg?v=2',
      alt:
        'A brindle Boxer stepping onto the Paw Grip ramp at the open hatch of a blue hatchback',
      label: 'Hatchbacks too',
      vehicles: ['car'],
    },
    {
      src: '/assets/product/grit/ramp-pickup-truck-rear-door.jpg',
      alt:
        'The Paw Grip ramp set up at the open rear door of a brown pickup truck cab',
      label: 'Pickup cabs',
      vehicles: ['truck', 'pickup'],
    },
    {
      src: '/assets/product/revised/ramp-scene-carrying-folded.jpg',
      alt:
        'A man holding the folded Paw Grip ramp at the open hatch of a white SUV while a white dog waits in the cargo area',
      label: 'Folds in half',
    },
    {
      src: '',
      kind: 'specs',
      alt: 'Specifications of the Paw Grip ramp',
      label: 'Specs',
    },
    {
      src: '/assets/product/revised/ramp-studio-three-quarter.jpg',
      alt:
        'Studio view of the Paw Grip foldable dog car ramp at a three-quarter angle on a white background',
      label: '62″ long · 16″ wide',
      fit: 'contain',
    },
    {
      src: '/assets/product/revised/ramp-folded-studio.jpg',
      alt:
        'Studio view of the Paw Grip foldable dog car ramp folded in half on a white background',
      label: 'Folded · 31″',
      fit: 'contain',
    },
  ] as readonly HeroPhoto[],
} as const;

export interface HeroPhoto {
  /** Empty for the `specs` frame, which renders text instead of an image. */
  src: string;
  /** 'specs' renders a readable spec card built from offers.ts. */
  kind?: 'photo' | 'specs';
  alt: string;
  label: string;
  fit?: 'cover' | 'contain';
  /** CSS object-position for cover frames (default center). */
  position?: string;
  /** Letterbox colour for contain frames. */
  bg?: string;
  /** kw_vehicle keys this photo matches — moved to the front for that ad. */
  vehicles?: readonly string[];
}

/**
 * Owner-supplied foam-steps clip (9 seconds). The caption in VideoProof and
 * the stairs guide must stay limited to what the frames show.
 */
export const FOAM_STEPS_CLIP = {
  src: '/assets/catalog/foam-steps-corgi.mp4',
  poster: '/assets/catalog/foam-steps-corgi.jpg',
  captions: '/assets/catalog/foam-steps-corgi.vtt',
  caption:
    'A corgi climbs the gray foam steps beside a bed, stands on the top, steps back down to the carpet, then moves on the bed.',
  durationLabel: '0:09',
  productSlug: 'orthopedic-foam-bed-steps',
} as const;

/* --------------------------------------------------------------------------
   Content gates. videoProof is on: the corgi clip is in public/assets.
   The others stay OFF until real, verified material exists.
   -------------------------------------------------------------------------- */

export const GATES = {
  /** 9-second corgi clip on the foam steps. Copy matches the footage. */
  videoProof: true,
  /** Owner-submitted vertical clips (needs real, credited customer videos). */
  ugcGallery: false,
  /** Verified buyer reviews (needs a real review source — see LAUNCH_BLOCKERS). */
  testimonials: false,
  /** Founder note (needs the founder's real text). */
  founderNote: false,
} as const;

/* --------------------------------------------------------------------------
   Business identity — Merchant Center / Google Ads require a real,
   verifiable business on the landing page. Owner-supplied values; the
   Footer's developer banner clears once no field starts with 'REPLACE_'.
   -------------------------------------------------------------------------- */

export const BUSINESS = {
  legalName: 'Paw Grip',
  addressLine1: '55 Church St',
  addressLine2: '',
  city: 'New York',
  state: 'NY',
  postalCode: '10007',
  country: 'United States',
  email: 'pawgrip@businesslocalrecords.com',
  phone: '1-800-729-3844',
} as const;

/** True while any required business field is still an unfilled placeholder. */
export const BUSINESS_IS_INCOMPLETE =
  BUSINESS.addressLine1.startsWith('REPLACE_') ||
  BUSINESS.city.startsWith('REPLACE_') ||
  BUSINESS.state.startsWith('REPLACE_') ||
  BUSINESS.postalCode.startsWith('REPLACE_') ||
  BUSINESS.phone.startsWith('REPLACE_');

/**
 * Env-flag deferral for the business identity.
 *
 * Set VITE_REQUIRE_BUSINESS_INFO=true in the host dashboard once the real
 * address/phone are filled in. With the flag ON and any placeholder still
 * present, `vite.config.ts` fails the build (so Netlify cannot deploy a
 * policy-violating site) and the Footer throws a loud render error. With the
 * flag unset — today's state — the build passes and only a developer notice
 * banner shows.
 */
export const REQUIRE_BUSINESS_INFO =
  import.meta.env.VITE_REQUIRE_BUSINESS_INFO === 'true';

/* --------------------------------------------------------------------------
   Founder note — gated placeholder. Inert until GATES.founderNote is true.
   -------------------------------------------------------------------------- */

export const FOUNDER_NOTE = {
  author: 'PLACEHOLDER — founder name',
  role: 'Founder, Paw Grip',
  body:
    'PLACEHOLDER — replace with the founder\u2019s own note: why this ramp exists, ' +
    'who it was built for, and what the 30-day trial means to you. Keep it ' +
    'first-person and free of medical claims. This text is inert until ' +
    'GATES.founderNote is enabled in this file.',
} as const;
