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
    frame: 'lg:object-[center_22%]',
    slug: 'foldable-dog-car-ramp',
  },
  {
    title: 'Into the back seat',
    caption: 'Steps at the side door',
    image: '/assets/catalog/side-door-steps.jpg',
    alt: 'Pet steps at a vehicle side door',
    frame: 'lg:object-center',
    slug: 'side-door-pet-steps',
  },
  {
    title: 'Onto the bed',
    caption: 'A ramp that stays in the bedroom',
    image: '/assets/catalog/bed-ramp.jpg',
    alt: 'A ramp from the floor to a bed',
    frame: 'lg:object-[center_58%]',
    slug: 'bed-ramp',
  },
] as const;

export const HomePage: React.FC = () => {
  const { search } = useLocation();
  const flagship = CATALOG[0];

  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-5 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12 lg:py-8">
        <img
          src="/assets/product/grit/ramp-boxer-hatchback.jpg"
          alt="A brindle Boxer stepping onto the Paw-Grip ramp at the hatch of a blue hatchback while its owner watches"
          className="order-2 aspect-square w-full rounded-2xl bg-white object-contain lg:order-1 lg:h-auto lg:max-h-[min(28rem,calc(100svh-13rem))] lg:w-auto"
        />
        <div className="order-1 lg:order-2">
          <p className="text-sm font-bold uppercase tracking-wide text-[#0F6E62]">Dog ramps and stairs</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#14202B] sm:mt-3 sm:text-5xl">
            A way up for the car, the bed, and the back seat.
          </h1>
          <p className="mt-3 max-w-md text-lg text-[#5C6B73] sm:mt-4">
            Paw-Grip is a shop for getting a pet up without a lift. Start with the foldable car ramp, or look through stairs and longer ramps.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4 lg:mt-8">
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
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-10">
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
                  <img src={job.image} alt={job.alt} className={`aspect-square w-full bg-white object-contain lg:aspect-[5/3] lg:object-cover ${job.frame}`} />
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

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-12">
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
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-12">
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
