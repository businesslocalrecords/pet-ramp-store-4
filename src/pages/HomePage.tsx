import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CATALOG, formatPrice, productPath } from '../lib/catalog';
import { ProductCard } from '../components/ProductCard';
import { Stars } from '../components/Stars';

const FEATURED_SLUGS = [
  'folding-pet-steps',
  'orthopedic-foam-bed-steps',
  'dog-hitch-step',
] as const;

const SHOWCASES = [
  {
    slug: 'foldable-dog-car-ramp',
    title: 'Most popular for the car',
    image: '/assets/product/grit/ramp-boxer-hatchback-hero.jpg',
    imageAlt: 'A brindle Boxer stepping onto the Paw Grip ramp at the open hatch of a blue hatchback',
    frame: 'object-center',
    shopLabel: 'Shop the car ramp',
    browseLabel: 'Browse more car ramps',
    place: 'car',
    type: 'ramp',
  },
  {
    slug: 'side-door-pet-steps',
    title: 'Most popular for the back seat',
    image: '/assets/catalog/side-door-steps-2.jpg',
    imageAlt: 'A dog in the back seat with pet steps at the open side door',
    frame: 'object-[center_30%]',
    shopLabel: 'Shop the back seat steps',
    browseLabel: 'Browse more back seat steps',
    place: 'car',
    type: 'stairs',
  },
  {
    slug: 'bed-ramp',
    title: 'Most popular for the bed',
    image: '/assets/catalog/bed-ramp.jpg',
    imageAlt: 'A fabric ramp running from the floor to a bed',
    frame: 'object-[center_42%]',
    shopLabel: 'Shop the bed ramp',
    browseLabel: 'Browse more bed ramps',
    place: 'home',
    type: 'ramp',
  },
] as const;

function filteredShopSearch(current: string, place: string, type: string): string {
  const params = new URLSearchParams(current);
  params.set('place', place);
  params.set('type', type);
  return `?${params.toString()}`;
}

const MEASURE_STEPS = [
  'Measure from the ground to the floor of the cargo area.',
  'Enter that number in the size finder.',
  'It tells you Compact or Extended.',
] as const;

export const HomePage: React.FC = () => {
  const { search } = useLocation();
  const featured = FEATURED_SLUGS.map((slug) => CATALOG.find((item) => item.slug === slug)!);

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-2 pt-5 sm:px-6 sm:pt-8">
        <p className="text-sm font-bold uppercase tracking-wide text-pine">Dog ramps and stairs</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:mt-3 sm:text-5xl">
          A way up for the car, the bed, and the back seat.
        </h1>
        <p className="mt-3 max-w-xl text-lg text-muted sm:mt-4">
          Ramps and stairs for the car, the bed, and the back seat. Your dog walks up instead of jumping or being lifted.
        </p>
        <a href="/guide/how-to-choose-a-dog-car-ramp/" className="mt-3 inline-block text-base font-bold text-pine underline-offset-4 hover:underline">
          Not sure which one? Read the guide
        </a>
      </section>

      {SHOWCASES.map((showcase) => {
        const product = CATALOG.find((item) => item.slug === showcase.slug)!;
        return (
          <section
            key={showcase.slug}
            className="mx-auto grid max-w-6xl items-center gap-4 border-t border-line px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-x-12 lg:py-10"
          >
            <div className="lg:col-start-2 lg:row-start-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{showcase.title}</h2>
            </div>
            <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
              <Link
                to={{ pathname: productPath(product), search }}
                className="block overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine"
              >
                <img
                  src={showcase.image}
                  alt={showcase.imageAlt}
                  className={`aspect-[3/2] w-full object-cover ${showcase.frame}`}
                />
              </Link>
              <p className="mt-3 text-sm font-semibold text-ink">{product.name}</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-3xl font-extrabold tabular-nums text-ink">{formatPrice(product.price)}</p>
                <Stars value={product.rating} count={product.ratingCount} />
              </div>
            </div>
            <div className="lg:col-start-2 lg:row-start-2">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to={{ pathname: productPath(product), search }}
                  className="inline-flex h-12 items-center rounded-full bg-cta px-6 text-base font-bold text-white hover:bg-cta-deep"
                >
                  {showcase.shopLabel}
                </Link>
                <Link
                  to={{ pathname: '/dog-ramps', search: filteredShopSearch(search, showcase.place, showcase.type) }}
                  className="text-base font-bold text-pine underline-offset-4 hover:underline"
                >
                  {showcase.browseLabel}
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Paw Grip ramps and steps</h2>
            <p className="mt-2 text-muted">The products we put our name on.</p>
          </div>
          <Link to={{ pathname: '/dog-ramps', search }} className="shrink-0 text-sm font-bold text-pine">
            See all ramps and steps
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-pine-deep text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-12">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">A short ramp is a steep ramp.</h2>
            <p className="mt-3 text-white/80">
              A ramp that is too short climbs too steeply for a dog to walk up. Measuring takes a minute.
            </p>
            <Link
              to={{ pathname: '/products/foldable-dog-car-ramp', hash: 'size-guide', search }}
              className="mt-6 inline-flex h-12 items-center rounded-full bg-white px-6 font-bold text-ink"
            >
              Open the size finder
            </Link>
          </div>
          <ol className="grid gap-3 text-sm">
            {MEASURE_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-2xl bg-white/10 px-4 py-3 font-semibold">
                <span className="text-white/60">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
};
