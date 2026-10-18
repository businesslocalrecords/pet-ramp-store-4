import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CATALOG, productPath } from '../lib/catalog';
import { GUARANTEE_LABEL, WARRANTY_PRODUCT_LABEL, FREE_SHIPPING_LABEL } from '../lib/policy';
import { ProductCard } from '../components/ProductCard';

const JOBS = [
  {
    title: 'Into the cargo area',
    caption: 'The bi-fold, for SUVs and hatchbacks',
    image: '/assets/product/grit/ramp-german-shepherd-suv.jpg',
    alt: 'A German Shepherd walking up a ramp into an SUV',
    slug: 'foldable-dog-car-ramp',
  },
  {
    title: 'Into the back seat',
    caption: 'Steps at the side door',
    image: '/assets/catalog/side-door-steps.jpg',
    alt: 'Pet steps at a vehicle side door',
    slug: 'side-door-pet-steps',
  },
  {
    title: 'Onto the bed',
    caption: 'A ramp that stays in the bedroom',
    image: '/assets/catalog/bed-ramp.jpg',
    alt: 'A ramp from the floor to a bed',
    slug: 'bed-ramp',
  },
] as const;

export const HomePage: React.FC = () => {
  const { search } = useLocation();
  const flagship = CATALOG[0];

  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <img
          src="/assets/product/grit/ramp-boxer-hatchback.jpg"
          alt="A brindle Boxer stepping onto the Paw-Grip ramp at the hatch of a blue hatchback while its owner watches"
          className="aspect-[5/3] w-full rounded-2xl bg-[#F3F6F7] object-cover"
        />
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#0F6E62]">Dog ramps and stairs</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#14202B] sm:text-5xl">
            A way up for the car, the bed, and the back seat.
          </h1>
          <p className="mt-4 max-w-md text-lg text-[#5C6B73]">
            Paw-Grip is a shop for getting a pet up without a lift. Start with the foldable car ramp, or look through stairs and longer ramps.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to={{ pathname: productPath(flagship), search }}
              className="inline-flex h-12 items-center rounded-full bg-[#F37021] px-6 text-base font-bold text-white hover:bg-[#D95E1A]"
            >
              Shop the car ramp
            </Link>
            <Link to={{ pathname: '/dog-ramps', search }} className="text-base font-bold text-[#0F6E62] underline-offset-4 hover:underline">
              Browse every ramp
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F6F7]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Shop by the job</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {JOBS.map((job) => {
              const product = CATALOG.find((item) => item.slug === job.slug)!;
              return (
                <Link
                  key={job.slug}
                  to={{ pathname: productPath(product), search }}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <img src={job.image} alt={job.alt} className="aspect-[4/3] w-full bg-[#F3F6F7] object-contain" />
                  <div className="p-4">
                    <h3 className="font-bold">{job.title}</h3>
                    <p className="mt-1 text-sm text-[#5C6B73]">{job.caption}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">In the shop</h2>
          <Link to={{ pathname: '/dog-ramps', search }} className="text-sm font-bold text-[#0F6E62]">
            See all
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CATALOG.slice(0, 4).map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-[#14202B] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Not sure of the length?</h2>
            <p className="mt-3 text-white/80">
              Measure from the ground to the cargo floor. The size finder on the car ramp picks Compact or Extended from that number.
            </p>
            <Link
              to={{ pathname: '/products/foldable-dog-car-ramp', hash: 'size-guide', search }}
              className="mt-6 inline-flex h-12 items-center rounded-full bg-white px-6 font-bold text-[#14202B]"
            >
              Open the size finder
            </Link>
          </div>
          <ul className="grid gap-3 text-sm">
            {[FREE_SHIPPING_LABEL, GUARANTEE_LABEL, WARRANTY_PRODUCT_LABEL].map((label) => (
              <li key={label} className="rounded-2xl bg-white/10 px-4 py-3 font-semibold">
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
};
