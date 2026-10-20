/**
 * Crawl metadata for every public URL.
 *
 * The React pages call `usePageMeta` with a path from this list, and the
 * production build writes the same title, description, canonical, and
 * JSON-LD into a static HTML shell per route. Prices and star counts come
 * from catalog.ts / offers.ts. Named reviews are not included.
 */

import { CATALOG, productPath, type CatalogProduct } from './catalog';
import { formatMoney, RAMP_SIZES } from './offers';
import { FREE_SHIPPING_LABEL, GUARANTEE_LABEL, POLICY, WARRANTY_PRODUCT_LABEL } from './policy';

export const SITE = 'https://pawgrip.app';

export interface SeoRoute {
  path: string;
  title: string;
  description: string;
  image: string;
  keywords: string;
  /** Present on product URLs. Omitted on policy and guide pages. */
  price: string | null;
  jsonLd: Record<string, unknown>;
}

function abs(src: string): string {
  if (src.startsWith('https://')) return src;
  return `${SITE}${src.startsWith('/') ? src : `/${src}`}`;
}

function page(path: string, title: string, description: string, image: string, keywords: string): SeoRoute {
  const url = path === '/' ? `${SITE}/` : `${SITE}${path}`;
  return {
    path,
    title,
    description,
    image: abs(image),
    keywords,
    price: null,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      url,
      description,
    },
  };
}

function productOffer(product: CatalogProduct, url: string): Record<string, unknown> {
  return {
    '@type': 'Offer',
    url,
    priceCurrency: 'USD',
    price: formatMoney(product.price),
    availability: 'https://schema.org/InStock',
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: POLICY.freeShipping ? '0' : undefined, currency: 'USD' },
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      merchantReturnDays: POLICY.returnDays,
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    },
  };
}

export function productJsonLd(product: CatalogProduct): Record<string, unknown> {
  const path = productPath(product);
  const url = `${SITE}${path}`;
  const image = product.photos[0]?.src ?? product.image;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: abs(image),
    description: product.summary,
    brand: { '@type': 'Brand', name: 'Paw Grip' },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating.toFixed(1),
            ratingCount: product.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    offers: productOffer(product, url),
  };
}

function productRoute(product: CatalogProduct): SeoRoute {
  const path = productPath(product);
  const image = product.photos[0]?.src ?? product.image;
  return {
    path,
    title: `${product.name} — Paw Grip`,
    description: product.summary,
    image: abs(image),
    keywords: product.name,
    price: formatMoney(product.price),
    jsonLd: productJsonLd(product),
  };
}

const flagship = CATALOG.find((product) => product.flagship) ?? CATALOG[0];
const heroImage = flagship.image;
const compact = RAMP_SIZES[0];
const extended = RAMP_SIZES[1];

const home = productRoute(flagship);
home.path = '/';
home.title = 'Paw Grip — Dog ramps and stairs';
home.description = `Paw Grip makes the jump a walk: a foldable car ramp rated to ${compact.weightCapacityLb} lb (Compact) or ${extended.weightCapacityLb} lb (Extended), plus stairs for the bed, the couch, and the back seat.`;
home.keywords = 'dog car ramp, foldable dog ramp, pet ramp for SUV, dog stairs for bed, folding pet steps';
home.jsonLd = productJsonLd(flagship);

const category: SeoRoute = {
  path: '/dog-ramps',
  title: 'Dog ramps and stairs — Paw-Grip',
  description: 'Foldable car ramps, bed ramps, foam steps, and folding pet steps.',
  image: abs(heroImage),
  keywords: 'dog ramps, dog stairs, pet steps',
  price: null,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Dog ramps and stairs',
    itemListElement: CATALOG.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: `${SITE}${productPath(product)}`,
    })),
  },
};

export const SEO_ROUTES: readonly SeoRoute[] = [
  home,
  category,
  ...CATALOG.map(productRoute),
  page('/about', 'About Paw Grip', 'Paw Grip sells dog ramps and stairs for the car, the bed, and the back seat.', heroImage, 'about Paw Grip'),
  page('/contact', 'Contact Paw Grip', 'Email Paw Grip about an order, a return, or which ramp fits.', heroImage, 'contact Paw Grip'),
  page(
    '/shipping',
    'Shipping Policy — Paw Grip',
    `${FREE_SHIPPING_LABEL}. The delivery window is ${POLICY.deliveryWindow}.`,
    heroImage,
    'Paw Grip shipping',
  ),
  page('/returns', 'Returns and refunds — Paw Grip', `${GUARANTEE_LABEL}.`, heroImage, 'Paw Grip returns'),
  page('/warranty', 'Hardware warranty — Paw Grip', `${WARRANTY_PRODUCT_LABEL}.`, heroImage, 'Paw Grip warranty'),
  page('/privacy', 'Privacy Policy — Paw Grip', 'How Paw Grip handles the information a shopper sends.', heroImage, 'Paw Grip privacy'),
  page('/terms', 'Terms of Service — Paw Grip', 'The terms for shopping at Paw Grip.', heroImage, 'Paw Grip terms'),
  page(
    '/guide/how-to-choose-a-dog-car-ramp',
    'How to choose a dog car ramp — Paw Grip',
    'Measure the cargo height, then match the Compact or Extended length.',
    heroImage,
    'how to choose a dog car ramp',
  ),
  page(
    '/guide/dog-stairs-for-bed-or-couch',
    'Dog stairs for a bed or a couch — Paw Grip',
    'Foam steps, folding steps, or a bed ramp. Pick from the height and whether it folds away.',
    '/assets/catalog/foam-steps-corgi.jpg',
    'dog stairs for bed, dog stairs for couch, foam pet steps',
  ),
];

export function seoFor(pathname: string): SeoRoute | undefined {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname || '/';
  return SEO_ROUTES.find((route) => route.path === path);
}

export function canonicalUrl(route: SeoRoute): string {
  return route.path === '/' ? `${SITE}/` : `${SITE}${route.path}`;
}
