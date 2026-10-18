/**
 * Storefront catalog for the ramp-and-stairs shop.
 *
 * Prices for the flagship ramp and its two add-ons come from offers.ts.
 * The other prices are the test assortment defined alongside the Shopify
 * seeder. Star ratings are numeric test ratings — no review text.
 */

import { ADDON_PRICES, PRODUCT_HANDLES, TIERS, formatMoney } from './offers';

export type CatalogUse = 'car' | 'home' | 'cargo';

export interface CatalogProduct {
  /** URL slug under /products/. The flagship uses a readable slug. */
  slug: string;
  /** Shopify handle. Matches scripts/shopify-seed.mjs. */
  shopifyHandle: string;
  name: string;
  /** Caption under the photograph. This is the Paw-Grip line, not a repaint of the file. */
  caption: string;
  summary: string;
  price: number;
  rating: number;
  ratingCount: number;
  image: string;
  imageAlt: string;
  /** Second frame for the card hover, when we have one. */
  imageHover?: string;
  use: CatalogUse;
  capacityLb: number;
  bullets: string[];
  /** The long-form flagship page, with the existing gallery. */
  flagship?: boolean;
}

export const CATALOG: readonly CatalogProduct[] = [
  {
    slug: 'foldable-dog-car-ramp',
    shopifyHandle: PRODUCT_HANDLES.heroRamp,
    name: 'Paw-Grip Foldable Dog Car Ramp',
    caption: 'Walks into the cargo area',
    summary: 'Bi-fold car ramp with a Paw-Grip grit deck. Compact rated to 150 lb, Extended to 250 lb.',
    price: TIERS[0].price,
    rating: 4.8,
    ratingCount: 214,
    image: '/assets/product/grit/ramp-german-shepherd-suv.jpg',
    imageHover: '/assets/product/grit/ramp-white-dog-walking-up-suv.jpg',
    imageAlt: 'A German Shepherd walking up the Paw-Grip ramp into an SUV',
    use: 'car',
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
    name: 'Paw-Grip Side Door Pet Steps',
    caption: 'Into the back seat',
    summary: 'Steps that meet a vehicle side door, so a dog climbs into the back seat instead of being lifted.',
    price: 149.95,
    rating: 4.6,
    ratingCount: 73,
    image: '/assets/catalog/side-door-steps.jpg',
    imageAlt: 'Pet steps set up at a vehicle side door',
    use: 'car',
    capacityLb: 200,
    bullets: ['Reaches a side-door sill', 'Platform at the top', 'Lifts in and out of the car'],
  },
  {
    slug: 'bed-ramp',
    shopifyHandle: PRODUCT_HANDLES.bedRamp,
    name: 'Paw-Grip Bed Ramp',
    caption: 'Up to the mattress',
    summary: 'A ramp from the floor to the bed for a dog that has stopped jumping up.',
    price: 129.95,
    rating: 4.7,
    ratingCount: 118,
    image: '/assets/catalog/bed-ramp.jpg',
    imageAlt: 'A fabric ramp running from the floor to a bed',
    use: 'home',
    capacityLb: 120,
    bullets: ['Reaches about 25″', 'Rated to 120 lb', 'Stays in the bedroom'],
  },
  {
    slug: 'extra-long-telescoping-dog-ramp',
    shopifyHandle: PRODUCT_HANDLES.extraLongRamp,
    name: 'Paw-Grip Extra Long Telescoping Ramp',
    caption: 'For tall truck beds',
    summary: 'Telescopes from 47″ to 87″ when the cargo floor is too high for a fixed ramp.',
    price: 189,
    rating: 4.5,
    ratingCount: 64,
    image: '/assets/catalog/extra-long-ramp.jpg',
    imageAlt: 'A long telescoping dog ramp on a white background',
    use: 'car',
    capacityLb: 150,
    bullets: ['Extends 47–87″', 'For tall truck beds', 'Collapses for storage'],
  },
  {
    slug: 'compact-telescoping-dog-ramp',
    shopifyHandle: PRODUCT_HANDLES.compactTelescoping,
    name: 'Paw-Grip Compact Telescoping Ramp',
    caption: 'The short trunk',
    summary: 'Telescopes from 28″ to 70″. The one that still fits a smaller trunk.',
    price: 159.99,
    rating: 4.3,
    ratingCount: 29,
    image: '/assets/catalog/compact-ramp.jpg',
    imageAlt: 'A compact telescoping dog ramp on a white background',
    use: 'car',
    capacityLb: 120,
    bullets: ['Extends 28–70″', '14 lb', 'For smaller cargo areas'],
  },
  {
    slug: 'orthopedic-foam-bed-steps',
    shopifyHandle: PRODUCT_HANDLES.bedSteps,
    name: 'Paw-Grip Foam Bed Steps',
    caption: 'Two steps to the couch',
    summary: 'Foam steps for a couch or a low bed. Light enough to move between rooms.',
    price: 65,
    rating: 4.4,
    ratingCount: 41,
    image: '/assets/catalog/foam-steps.jpg',
    imageAlt: 'Foam pet steps on a white background',
    use: 'home',
    capacityLb: 80,
    bullets: ['Rated to 80 lb', 'For couch and low beds', 'Two sizes in the catalog'],
  },
  {
    slug: 'dog-hitch-step',
    shopifyHandle: PRODUCT_HANDLES.hitchStep,
    name: 'Paw-Grip Hitch Step',
    caption: 'A step at the tailgate',
    summary: 'A hitch-mounted step for dogs who do better with one step than a long ramp.',
    price: 89.95,
    rating: 4.6,
    ratingCount: 52,
    image: '/assets/catalog/hitch-step.jpg',
    imageAlt: 'A hitch-mounted pet step on a white background',
    use: 'cargo',
    capacityLb: 150,
    bullets: ['Mounts at the hitch', 'Folds up to stow', 'For truck tailgates'],
  },
  {
    slug: 'folding-pet-steps',
    shopifyHandle: PRODUCT_HANDLES.foldingSteps,
    name: 'Paw-Grip Folding Pet Steps',
    caption: 'Flattens for the closet',
    summary: 'Folding steps for inside the house. They flatten when you need the floor back.',
    price: 74.95,
    rating: 4.5,
    ratingCount: 88,
    image: '/assets/catalog/folding-steps.jpg',
    imageAlt: 'Folding pet steps on a white background',
    use: 'home',
    capacityLb: 100,
    bullets: ['Folds flat', 'For couch and low beds', 'Light enough to carry'],
  },
  {
    slug: 'traction-mat',
    shopifyHandle: PRODUCT_HANDLES.tractionMat,
    name: 'Heavy-Duty Traction Mat (2-Pack)',
    caption: 'Under the ramp',
    summary: 'A mat under the feet of the ramp so it stays put on a smooth garage floor.',
    price: ADDON_PRICES.tractionMat,
    rating: 4.7,
    ratingCount: 36,
    image: '/assets/product/mat-traction-2pack.svg',
    imageAlt: 'Illustration of the traction mat two-pack',
    use: 'cargo',
    capacityLb: 250,
    bullets: ['2-pack', 'Sits under the ramp feet', 'For smooth floors'],
  },
  {
    slug: 'car-safety-tether',
    shopifyHandle: PRODUCT_HANDLES.carTether,
    name: 'Adjustable Car Safety Tether',
    caption: 'Once they are in',
    summary: 'An adjustable tether that clips to a harness so a dog can sit, stand, or lie down in the car.',
    price: ADDON_PRICES.carTether,
    rating: 4.6,
    ratingCount: 44,
    image: '/assets/product/tether-adjustable.svg',
    imageAlt: 'Illustration of the adjustable car safety tether',
    use: 'car',
    capacityLb: 250,
    bullets: ['Clips to a harness', 'Adjustable length', 'Front or rear seat'],
  },
];

export function productPath(product: CatalogProduct): string {
  return product.flagship ? '/products/foldable-dog-car-ramp' : `/products/${product.slug}`;
}

export function findBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG.find((product) => product.slug === slug || product.shopifyHandle === slug);
}

export function formatPrice(value: number): string {
  return `$${formatMoney(value)}`;
}
