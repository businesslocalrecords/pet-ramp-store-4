import React from 'react';
import { formatPrice, type CatalogProduct } from '../lib/catalog';
import { factsFor, type SpecRow } from '../lib/product-facts';
import {
  FREE_SHIPPING_LABEL,
  GUARANTEE_LABEL,
  POLICY,
  WARRANTY_PRODUCT_LABEL,
} from '../lib/policy';

/**
 * Decision page for every product except the foldable car ramp.
 *
 * The ramp page is a long story written from that ramp's own specs. This
 * page is the other idea: measurements first, then the store's promise, then
 * a second buy button. Product-specific blocks render only when
 * `product-facts.json` (or the catalog's own bullets and weight rating) has
 * something true to say. They stay absent rather than borrowing the ramp.
 */
const STORE_QUESTIONS = [
  {
    q: 'How does the money-back guarantee work?',
    a: `Email us within ${POLICY.returnDays} days of delivery and we send a prepaid return label. You get a full refund once we receive it. No restocking fee.`,
  },
  {
    q: 'How fast does it ship?',
    a: `${FREE_SHIPPING_LABEL}. Delivery is ${POLICY.deliveryWindow} in the continental United States, insured and tracked.`,
  },
  {
    q: 'What does the warranty cover?',
    a: `${WARRANTY_PRODUCT_LABEL} against manufacturing defects. The ${GUARANTEE_LABEL} is separate.`,
  },
];

export const CatalogLanding: React.FC<{
  product: CatalogProduct;
  buying: boolean;
  onBuy: () => void;
}> = ({ product, buying, onBuy }) => {
  const facts = factsFor(product.slug);
  const details = facts && facts.details.length > 0 ? facts.details : product.bullets;
  const specs: SpecRow[] = [...(facts?.specs ?? [])];
  if (product.capacityLb > 0 && !specs.some((row) => /capacity|weight rating/i.test(row.label))) {
    specs.unshift({ label: 'Weight rating', value: `${product.capacityLb} lb` });
  }
  const instructions = facts?.instructions ?? [];
  const included = facts?.included ?? [];
  const questions = [...(facts?.questions ?? []), ...STORE_QUESTIONS];

  return (
    <div className="mt-16 border-t border-line pt-12">
      <p className="text-sm font-bold uppercase tracking-wide text-pine">Before you buy</p>
      <h2 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight">Check the fit. Then decide.</h2>
      <p className="mt-3 max-w-2xl text-muted">{product.summary}</p>

      {details.length > 0 && (
        <section className="mt-10" aria-labelledby="catalog-details">
          <h3 id="catalog-details" className="text-xl font-extrabold tracking-tight">What you are buying</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {details.map((line) => (
              <li key={line} className="rounded-2xl border border-line bg-white p-4 text-sm leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      {specs.length > 0 && (
        <section className="mt-10" aria-labelledby="catalog-specs">
          <h3 id="catalog-specs" className="text-xl font-extrabold tracking-tight">Measurements</h3>
          <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {specs.map((row) => (
              <div key={`${row.label}-${row.value}`} className="rounded-2xl border border-line bg-white p-4">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{row.label}</dt>
                <dd className="mt-1 text-lg font-extrabold leading-snug">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {instructions.length > 0 && (
        <section className="mt-10" aria-labelledby="catalog-setup">
          <h3 id="catalog-setup" className="text-xl font-extrabold tracking-tight">How it sets up</h3>
          <ol className="mt-4 grid gap-3">
            {instructions.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-2xl border border-line bg-white p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {included.length > 0 && (
        <section className="mt-10" aria-labelledby="catalog-included">
          <h3 id="catalog-included" className="text-xl font-extrabold tracking-tight">In the box</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {included.map((item) => (
              <li key={item} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold">
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10" aria-labelledby="catalog-promise">
        <h3 id="catalog-promise" className="text-xl font-extrabold tracking-tight">If it is the wrong one</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-line bg-white p-5">
            <h4 className="font-bold">Shipping</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {FREE_SHIPPING_LABEL}. Delivery is {POLICY.deliveryWindow} in the continental United States.
            </p>
            <a href="/shipping/" className="mt-3 inline-block text-sm font-bold text-pine">Shipping policy</a>
          </article>
          <article className="rounded-2xl border border-line bg-white p-5">
            <h4 className="font-bold">{GUARANTEE_LABEL}</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {POLICY.returnDays} days from delivery. We send a prepaid label, and the refund goes out once we receive it.
            </p>
            <a href="/returns/" className="mt-3 inline-block text-sm font-bold text-pine">Returns policy</a>
          </article>
          <article className="rounded-2xl border border-line bg-white p-5">
            <h4 className="font-bold">{WARRANTY_PRODUCT_LABEL}</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Manufacturing defects for {POLICY.warrantyMonths} months. The guarantee above is separate.
            </p>
            <a href="/warranty/" className="mt-3 inline-block text-sm font-bold text-pine">Warranty</a>
          </article>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="catalog-questions">
        <h3 id="catalog-questions" className="text-xl font-extrabold tracking-tight">Questions</h3>
        <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
          {questions.map((item) => (
            <details key={item.q} className="px-5 py-4">
              <summary className="cursor-pointer font-bold">{item.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-3xl bg-ink px-6 py-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-mist">Ready when you are</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums">{formatPrice(product.price)}</p>
          <p className="mt-1 text-sm text-white/80">{FREE_SHIPPING_LABEL}</p>
        </div>
        <button
          type="button"
          onClick={onBuy}
          disabled={buying}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-cta px-6 text-base font-bold text-white hover:bg-cta-deep disabled:opacity-60 sm:mt-0 sm:w-auto"
        >
          {buying ? 'Starting checkout…' : `Add to cart · ${formatPrice(product.price)}`}
        </button>
      </section>
    </div>
  );
};
