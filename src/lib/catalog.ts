/**
 * Storefront catalog for the ramp-and-stairs shop.
 *
 * Prices for the flagship ramp and its two add-ons come from offers.ts.
 * The other prices are the test assortment defined alongside the Shopify
 * seeder. Star ratings are numeric test ratings — no review text.
 */

import chewyProducts from './chewy-products.json';
import { ADDON_PRICES, PRODUCT_HANDLES, TIERS, formatMoney, priceFromChewyCost } from './offers';

export type CatalogUse = 'car' | 'home' | 'cargo';
export type CatalogKind = 'ramp' | 'stairs' | 'accessory';

export interface CatalogProduct {
  /** URL slug under /products/. The flagship uses a readable slug. */
  slug: string;
  /** Shopify handle. Matches scripts/shopify-seed.mjs. */
  shopifyHandle: string;
  name: string;
  /** Caption under the photograph. This is the Paw Grip line, not a repaint of the file. */
  caption: string;
  summary: string;
  price: number;
  rating: number;
  ratingCount: number;
  image: string;
  imageAlt: string;
  /** Extra manufacturer frames for the product page. The first entry is `image`. */
  photos: readonly { src: string; alt: string; label: string }[];
  /** Second frame for the card hover, when we have one. */
  imageHover?: string;
  use: CatalogUse;
  kind: CatalogKind;
  capacityLb: number;
  bullets: string[];
  /** The long-form flagship page, with the existing gallery. */
  flagship?: boolean;
}

const OWN_CATALOG: readonly CatalogProduct[] = [
  {
    slug: 'foldable-dog-car-ramp',
    shopifyHandle: PRODUCT_HANDLES.heroRamp,
    name: 'Paw Grip Foldable Dog Car Ramp',
    caption: 'The walk into the cargo area',
    summary: 'A bi-fold ramp with a grit deck and raised rails. Compact is rated to 150 lb and folds to 31″. Extended reaches 70″ and is rated to 250 lb.',
    price: TIERS[0].price,
    rating: 4.8,
    ratingCount: 214,
    image: '/assets/product/grit/ramp-german-shepherd-suv.jpg',
    imageHover: '/assets/product/grit/ramp-white-dog-walking-up-suv.jpg',
    imageAlt: 'A German Shepherd walking up the Paw Grip ramp into an SUV',
    photos: [],
    use: 'car',
    kind: 'ramp',
    capacityLb: 150,
    bullets: [
      'Compact 62″, folds to 31″',
      'Extended 70″ for taller cargo floors',
      'Grit deck and raised side rails',
    ],
    flagship: true,
  },
  {
    slug: 'side-door-pet-steps',
    shopifyHandle: PRODUCT_HANDLES.sideDoorSteps,
    name: 'Paw Grip Side Door Pet Steps',
    caption: 'The climb into the back seat',
    summary: 'Steps that meet a side-door sill, with a platform at the top, so a dog walks into the back seat instead of being lifted over it.',
    price: 149.95,
    rating: 4.6,
    ratingCount: 73,
    image: '/assets/catalog/side-door-steps.jpg',
    imageAlt: 'Pet steps set up at a vehicle side door',
    photos: [
      {
        src: '/assets/catalog/side-door-steps.jpg',
        alt: 'Pet steps set up at a vehicle side door',
        label: 'Into the back seat',
      },
      {
        src: '/assets/catalog/side-door-steps-2.jpg',
        alt: 'A dog in the back seat with pet steps at the open side door',
        label: 'At the door',
      },
    ],
    use: 'car',
    kind: 'stairs',
    capacityLb: 200,
    bullets: ['Reaches a side-door sill', 'Platform at the top', 'Lifts in and out of the car'],
  },
  {
    slug: 'bed-ramp',
    shopifyHandle: PRODUCT_HANDLES.bedRamp,
    name: 'Paw Grip Bed Ramp',
    caption: 'From the floor to the mattress',
    summary: 'A carpeted ramp that stays beside the bed, for a dog who has started hesitating before the jump up.',
    price: 129.95,
    rating: 4.7,
    ratingCount: 118,
    image: '/assets/catalog/bed-ramp.jpg',
    imageAlt: 'A fabric ramp running from the floor to a bed',
    photos: [
      {
        src: '/assets/catalog/bed-ramp.jpg',
        alt: 'A fabric ramp running from the floor to a bed',
        label: 'Up to the mattress',
      },
      {
        src: '/assets/catalog/bed-ramp-2.jpg',
        alt: 'A husky sitting beside a light wood ramp at the foot of a bed',
        label: 'Light wood',
      },
      {
        src: '/assets/catalog/bed-ramp-3.jpg',
        alt: 'A bulldog on a bed with a fabric ramp running down to the floor',
        label: 'On the bed',
      },
      {
        src: '/assets/catalog/bed-ramp-4.jpg',
        alt: 'A light wood bed ramp on a white background',
        label: 'The ramp',
      },
    ],
    use: 'home',
    kind: 'ramp',
    capacityLb: 120,
    bullets: ['Reaches about 25″', 'Rated to 120 lb', 'Stays in the bedroom'],
  },
  {
    slug: 'extra-long-telescoping-dog-ramp',
    shopifyHandle: PRODUCT_HANDLES.extraLongRamp,
    name: 'Paw Grip Extra Long Telescoping Ramp',
    caption: 'When the truck bed is too high',
    summary: 'Slides out from 47″ to 87″, so a tall cargo floor gets a longer, gentler slope, then collapses for the garage.',
    price: 189,
    rating: 4.5,
    ratingCount: 64,
    image: '/assets/catalog/extra-long-ramp.jpg',
    imageAlt: 'A German Shepherd at the top of a long telescoping ramp into a pickup bed',
    photos: [
      {
        src: '/assets/catalog/extra-long-ramp.jpg',
        alt: 'A German Shepherd at the top of a long telescoping ramp into a pickup bed',
        label: 'For tall truck beds',
      },
    ],
    use: 'car',
    kind: 'ramp',
    capacityLb: 150,
    bullets: ['Extends 47–87″', 'For tall truck beds', 'Collapses for storage'],
  },
  {
    slug: 'compact-telescoping-dog-ramp',
    shopifyHandle: PRODUCT_HANDLES.compactTelescoping,
    name: 'Paw Grip Compact Telescoping Ramp',
    caption: 'Length when you need it',
    summary: 'Three sections that open from 28″ to 70″. Long enough for the cargo floor, short enough to live in a smaller trunk.',
    price: 159.99,
    rating: 4.3,
    ratingCount: 29,
    image: '/assets/catalog/compact-ramp.jpg',
    imageAlt: 'A boxer standing in an open hatch with a compact telescoping ramp',
    photos: [
      {
        src: '/assets/catalog/compact-ramp.jpg',
        alt: 'A boxer standing in an open hatch with a compact telescoping ramp',
        label: 'The short trunk',
      },
    ],
    use: 'car',
    kind: 'ramp',
    capacityLb: 120,
    bullets: ['Extends 28–70″', '14 lb', 'For smaller cargo areas'],
  },
  {
    slug: 'orthopedic-foam-bed-steps',
    shopifyHandle: PRODUCT_HANDLES.bedSteps,
    name: 'Paw Grip Foam Bed Steps',
    caption: 'The short climb to the couch',
    summary: 'Foam steps you can carry from the couch to a low bed. Two sizes, rated to 80 lb, for the jump that happens all day inside the house.',
    price: 65,
    rating: 4.4,
    ratingCount: 41,
    image: '/assets/catalog/foam-steps.jpg',
    imageAlt: 'Foam pet steps on a white background',
    photos: [
      {
        src: '/assets/catalog/foam-steps.jpg',
        alt: 'Foam pet steps on a white background',
        label: 'Two steps to the couch',
      },
      {
        src: '/assets/catalog/foam-steps-2.jpg',
        alt: 'A pug on a couch with foam pet steps beside it',
        label: 'By the couch',
      },
      {
        src: '/assets/catalog/foam-steps-3.jpg',
        alt: 'A small dog standing on foam pet steps next to an armchair',
        label: 'On the chair',
      },
    ],
    use: 'home',
    kind: 'stairs',
    capacityLb: 80,
    bullets: ['Rated to 80 lb', 'For couch and low beds', 'Two sizes in the catalog'],
  },
  {
    slug: 'dog-hitch-step',
    shopifyHandle: PRODUCT_HANDLES.hitchStep,
    name: 'Paw Grip Hitch Step',
    caption: 'One step at the tailgate',
    summary: 'Mounts on the hitch and folds up for the drive. For the dog who plants a paw on a step more willingly than on a long ramp.',
    price: 89.95,
    rating: 4.6,
    ratingCount: 52,
    image: '/assets/catalog/hitch-step.jpg',
    imageAlt: 'A hitch-mounted pet step on a white background',
    photos: [
      {
        src: '/assets/catalog/hitch-step.jpg',
        alt: 'A French bulldog standing on a hitch step at the back of an SUV',
        label: 'A step at the tailgate',
      },
      {
        src: '/assets/catalog/hitch-step-2.jpg',
        alt: 'A hitch step standing open on a white background',
        label: 'Open',
      },
      {
        src: '/assets/catalog/hitch-step-3.jpg',
        alt: 'A small dog stepping onto a hitch step at a vehicle tailgate',
        label: 'In the driveway',
      },
      {
        src: '/assets/catalog/hitch-step-4.jpg',
        alt: 'Side view of a hitch step on a white background',
        label: 'Side view',
      },
      {
        src: '/assets/catalog/hitch-step-5.jpg',
        alt: 'Three-quarter view of a hitch step on a white background',
        label: 'Three-quarter',
      },
    ],
    use: 'cargo',
    kind: 'stairs',
    capacityLb: 150,
    bullets: ['Mounts at the hitch', 'Folds up to stow', 'For truck tailgates'],
  },
  {
    slug: 'folding-pet-steps',
    shopifyHandle: PRODUCT_HANDLES.foldingSteps,
    name: 'Paw Grip Folding Pet Steps',
    caption: 'Up for the evening, flat by morning',
    summary: 'Folding steps for the couch or a low bed. They stand for the climb, then flatten when the room needs its floor back.',
    price: 74.95,
    rating: 4.5,
    ratingCount: 88,
    image: '/assets/catalog/folding-steps.jpg',
    imageAlt: 'Folding pet steps on a white background',
    photos: [
      {
        src: '/assets/catalog/folding-steps.jpg',
        alt: 'A small dog beside gray folding pet steps in a living room',
        label: 'Flattens for the closet',
      },
      {
        src: '/assets/catalog/folding-steps-2.jpg',
        alt: 'A corgi beside tan folding pet steps next to a couch',
        label: 'Tan',
      },
      {
        src: '/assets/catalog/folding-steps-3.jpg',
        alt: 'A white dog sitting on tan folding pet steps',
        label: 'Four steps',
      },
      {
        src: '/assets/catalog/folding-steps-4.jpg',
        alt: 'A collie beside gray folding pet steps next to a couch',
        label: 'Gray',
      },
    ],
    use: 'home',
    kind: 'stairs',
    capacityLb: 100,
    bullets: ['Folds flat', 'For couch and low beds', 'Light enough to carry'],
  },
  {
    slug: 'traction-mat',
    shopifyHandle: PRODUCT_HANDLES.tractionMat,
    name: 'Heavy-Duty Traction Mat (2-Pack)',
    caption: 'So the ramp stays planted',
    summary: 'A pair of mats under the ramp feet. On a polished garage floor, they keep the ramp from creeping the moment a dog steps on.',
    price: ADDON_PRICES.tractionMat,
    rating: 4.7,
    ratingCount: 36,
    image: '/assets/product/mat-traction-2pack.svg',
    imageAlt: 'Illustration of the traction mat two-pack',
    photos: [],
    use: 'cargo',
    kind: 'accessory',
    capacityLb: 250,
    bullets: ['2-pack', 'Sits under the ramp feet', 'For smooth floors'],
  },
  {
    slug: 'car-safety-tether',
    shopifyHandle: PRODUCT_HANDLES.carTether,
    name: 'Adjustable Car Safety Tether',
    caption: 'Settled for the drive',
    summary: 'Clips to a harness and the seatbelt. Enough slack to sit, stand, or lie down — not enough to roam the cabin.',
    price: ADDON_PRICES.carTether,
    rating: 4.6,
    ratingCount: 44,
    image: '/assets/product/tether-adjustable.svg',
    imageAlt: 'Illustration of the adjustable car safety tether',
    photos: [],
    use: 'car',
    kind: 'accessory',
    capacityLb: 250,
    bullets: ['Clips to a harness', 'Adjustable length', 'Front or rear seat'],
  },
];

interface ChewyProduct {
  dp: string;
  name: string;
  cost: number;
  kind: CatalogKind;
  use: CatalogUse;
  images: string[];
}

function chewyCaption(use: CatalogUse): string {
  if (use === 'car') return 'For the car';
  if (use === 'cargo') return 'For the hitch';
  return 'For the bed or the couch';
}

const CHEWY_CATALOG: readonly CatalogProduct[] = (chewyProducts as ChewyProduct[]).map((item) => ({
  slug: `dp-${item.dp}`,
  shopifyHandle: `chewy-${item.dp}`,
  name: item.name,
  caption: chewyCaption(item.use),
  summary: 'In the shop for the car, the bed, or the couch.',
  price: priceFromChewyCost(item.cost),
  rating: 0,
  ratingCount: 0,
  image: item.images[0],
  imageHover: item.images[1],
  imageAlt: item.name,
  photos: item.images.map((src, index) => ({
    src,
    alt: item.name,
    label: index === 0 ? 'Photo' : `Photo ${index + 1}`,
  })),
  use: item.use,
  kind: item.kind,
  capacityLb: 0,
  bullets: [],
}));

export const CATALOG: readonly CatalogProduct[] = [...OWN_CATALOG, ...CHEWY_CATALOG];

export function productPath(product: CatalogProduct): string {
  return product.flagship ? '/products/foldable-dog-car-ramp' : `/products/${product.slug}`;
}

export function findBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG.find((product) => product.slug === slug || product.shopifyHandle === slug);
}

export function formatPrice(value: number): string {
  return `$${formatMoney(value)}`;
}
