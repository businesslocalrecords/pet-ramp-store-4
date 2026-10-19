import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CATALOG, formatPrice, productPath } from '../lib/catalog';
import { ProductCard } from '../components/ProductCard';
import { Stars } from '../components/Stars';

const FEATURED_SLUGS = [
  'side-door-pet-steps',
  'bed-ramp',
  'folding-pet-steps',
  'orthopedic-foam-bed-steps',
] as const;

const MEASURE_STEPS = [
  'Measure from the ground to the floor of the cargo area.',
  'Enter that number in the size finder.',
  'It tells you Compact or Extended.',
] as const;

const PLACE_TILES = [
  {
    title: 'Car, SUV or truck',
    place: 'car',
    image: '/assets/product/grit/ramp-german-shepherd-suv.jpg',
    alt: 'A German Shepherd walking up a ramp into an SUV',
    frame: 'object-[center_22%]',
  },
  {
    title: 'Bed or couch',
    place: 'home',
    image: '/assets/catalog/bed-ramp.jpg',
    alt: 'A ramp from the floor to a bed',
    frame: 'object-[center_58%]',
  },
  {
    title: 'Door or hitch',
    place: 'cargo',
    image: '/assets/catalog/hitch-step.jpg',
    alt: 'A step at a trailer hitch',
    frame: 'object-center',
  },
] as const;

export const HomePage: React.FC = () => {
  const { search } = useLocation();
  const flagship = CATALOG[0];
  const featured = FEATURED_SLUGS.map((slug) => CATALOG.find((item) => item.slug === slug)!);

  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-5 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-[auto_auto] lg:gap-x-12 lg:gap-y-5 lg:py-8">
        <div className="lg:col-start-2 lg:row-start-1 lg:self-end">
          <p className="text-sm font-bold uppercase tracking-wide text-pine">Dog ramps and stairs</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:mt-3 sm:text-5xl">
            A way up for the car, the bed, and the back seat.
          </h1>
          <p className="mt-3 max-w-md text-lg text-muted sm:mt-4">
            Ramps and stairs for the car, the bed, and the back seat. Your dog walks up instead of jumping or being lifted.
          </p>
        </div>
        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-center">
          <Link
            to={{ pathname: productPath(flagship), search }}
            className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine"
          >
            <img
              src="/assets/product/grit/ramp-boxer-hatchback-hero.jpg"
              alt="A brindle Boxer stepping onto the Paw Grip ramp at the hatch of a blue hatchback while its owner watches"
              className="h-auto w-full rounded-2xl object-cover lg:max-h-[min(28rem,calc(100svh-13rem))] lg:w-auto"
            />
          </Link>
          <p className="mt-3 text-sm font-semibold text-ink">Paw Grip Foldable Dog Car Ramp</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-3xl font-extrabold tabular-nums text-ink">{formatPrice(flagship.price)}</p>
            <Stars value={flagship.rating} count={flagship.ratingCount} />
          </div>
        </div>
        <div className="lg:col-start-2 lg:row-start-2 lg:self-start">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to={{ pathname: productPath(flagship), search }}
              className="inline-flex h-12 items-center rounded-full bg-cta px-6 text-base font-bold text-white hover:bg-cta-deep"
            >
              Shop the car ramp
            </Link>
            <Link to={{ pathname: '/dog-ramps', search }} className="text-base font-bold text-pine underline-offset-4 hover:underline">
              Browse every ramp
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-well">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-10">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Where does your dog need a boost?</h2>
          <p className="mt-2 max-w-xl text-muted">Pick the place. We show what fits.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {PLACE_TILES.map((tile) => (
              <Link
                key={tile.title}
                to={{ pathname: '/dog-ramps', search: `?place=${tile.place}` }}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <img src={tile.image} alt={tile.alt} className={`aspect-[5/3] w-full bg-white object-cover ${tile.frame}`} />
                <div className="p-4">
                  <h3 className="font-bold">{tile.title}</h3>
                  <p className="mt-1 text-sm text-muted">{CATALOG.filter((item) => item.use === tile.place).length} products</p>
                </div>
              </Link>
            ))}
            <a
              href="/guide/how-to-choose-a-dog-car-ramp/"
              className="flex flex-col justify-center rounded-2xl bg-mist p-6 transition hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <h3 className="font-bold">Not sure which one?</h3>
              <p className="mt-1 text-sm text-muted">Read how to choose a ramp for your car and your dog.</p>
              <span className="mt-3 text-sm font-bold text-pine">Read the guide</span>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Paw Grip ramps and steps</h2>
            <p className="mt-2 text-muted">Our own line, each with a star rating.</p>
          </div>
          <Link to={{ pathname: '/dog-ramps', search }} className="shrink-0 text-sm font-bold text-pine">
            See all {CATALOG.length} ramps and steps
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
