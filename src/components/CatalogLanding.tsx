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
const PRIMARY_SPECS = [
  'Dimensions',
  'Weight',
  'Recommended Pet Weight',
  'Number Of Steps',
  'Step Rise',
  'Step Depth',
  'Material',
  'Weight rating',
];
const HIDDEN_SPECS = ['Item Number', 'Sourced From', 'Placement', 'Features'];
const SPEC_LABELS: Record<string, string> = {
  Weight: 'Product weight',
  'Recommended Pet Weight': 'Pet weight',
  'Number Of Steps': 'Steps',
  'Weight rating': 'Weight rating',
};

function plainLabel(label: string): string {
  if (SPEC_LABELS[label]) return SPEC_LABELS[label];
  const lower = label.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function plainValue(value: string): string {
  return value
    .replace(/-inches\b/gi, ' in')
    .replace(/\s*inch(es)?\b/gi, ' in')
    .replace(/\s*pounds?\b/gi, ' lb')
    .replace(/\s*(lbs|lb)\b/gi, ' lb');
}

function listFeatures(specs: SpecRow[]): string[] {
  const row = specs.find((item) => item.label === 'Features');
  return row ? row.value.split(',').map((part) => part.trim()).filter(Boolean) : [];
}

export const CatalogLanding: React.FC<{
  product: CatalogProduct;
  buying: boolean;
  onBuy: () => void;
}> = ({ product, buying, onBuy }) => {
  const facts = factsFor(product.slug);
  const details = (facts?.details ?? []).filter((line) => !product.bullets.includes(line));
  const specs: SpecRow[] = [...(facts?.specs ?? [])];
  if (product.capacityLb > 0 && !specs.some((row) => /capacity|weight rating/i.test(row.label))) {
    specs.unshift({ label: 'Weight rating', value: `${product.capacityLb} lb` });
  }
  const instructions = facts?.instructions ?? [];
  const included = facts?.included ?? [];
  const questions = facts?.questions ?? [];
  const features = listFeatures(specs);
  const visibleSpecs = specs.filter((row) => !HIDDEN_SPECS.includes(row.label));
  const primarySpecs = visibleSpecs.filter((row) => PRIMARY_SPECS.includes(row.label));
  const moreSpecs = visibleSpecs.filter((row) => !PRIMARY_SPECS.includes(row.label));

  return (
    <div className="mt-16 border-t border-line pt-12">
      {details.length > 0 && (
        <section aria-labelledby="catalog-details">
          <h2 id="catalog-details" className="text-xl font-extrabold tracking-tight">What it does</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {details.map((line) => (
              <li key={line} className="rounded-2xl border border-line bg-white p-4 text-sm leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      {visibleSpecs.length > 0 && (
        <section className="mt-10" aria-labelledby="catalog-specs">
          <h2 id="catalog-specs" className="text-xl font-extrabold tracking-tight">Size and weight</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(primarySpecs.length > 0 ? primarySpecs : visibleSpecs).map((row) => (
              <div key={`${row.label}-${row.value}`} className="rounded-2xl border border-line bg-white p-4">
                <dt className="text-xs font-semibold text-muted">{plainLabel(row.label)}</dt>
                <dd className="mt-1 text-lg font-extrabold leading-snug">{plainValue(row.value)}</dd>
              </div>
            ))}
          </dl>
          {features.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {features.map((feature) => (
                <li key={feature} className="rounded-full bg-mist px-3 py-1.5 text-sm font-semibold text-pine-deep">
                  {feature}
                </li>
              ))}
            </ul>
          )}
          {primarySpecs.length > 0 && moreSpecs.length > 0 && (
            <details className="mt-4 rounded-2xl border border-line bg-white px-5 py-4">
              <summary className="cursor-pointer text-sm font-bold">More details</summary>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {moreSpecs.map((row) => (
                  <div key={`${row.label}-${row.value}`} className="flex justify-between gap-4 border-b border-line py-1.5">
                    <dt className="text-muted">{plainLabel(row.label)}</dt>
                    <dd className="text-right font-semibold">{plainValue(row.value)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </section>
      )}

      {instructions.length > 0 && (
        <section className="mt-10" aria-labelledby="catalog-setup">
          <h2 id="catalog-setup" className="text-xl font-extrabold tracking-tight">Setup</h2>
          <details className="mt-4 rounded-2xl border border-line bg-white px-5 py-4">
            <summary className="cursor-pointer font-bold">{instructions.length} steps to set it up</summary>
            <ol className="mt-4 grid gap-3">
              {instructions.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </details>
        </section>
      )}

      {included.length > 0 && (
        <section className="mt-10" aria-labelledby="catalog-included">
          <h2 id="catalog-included" className="text-xl font-extrabold tracking-tight">In the box</h2>
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
        <h2 id="catalog-promise" className="text-xl font-extrabold tracking-tight">Shipping, returns and warranty</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-line bg-white p-5">
            <h3 className="font-bold">Shipping</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {FREE_SHIPPING_LABEL}. Delivery is {POLICY.deliveryWindow} in the continental United States.
            </p>
            <a href="/shipping/" className="mt-3 inline-block text-sm font-bold text-pine">Shipping policy</a>
          </article>
          <article className="rounded-2xl border border-line bg-white p-5">
            <h3 className="font-bold">{GUARANTEE_LABEL}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {POLICY.returnDays} days from delivery. We send a prepaid label, and the refund goes out once we receive it.
            </p>
            <a href="/returns/" className="mt-3 inline-block text-sm font-bold text-pine">Returns policy</a>
          </article>
          <article className="rounded-2xl border border-line bg-white p-5">
            <h3 className="font-bold">{WARRANTY_PRODUCT_LABEL}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Manufacturing defects for {POLICY.warrantyMonths} months. The guarantee above is separate.
            </p>
            <a href="/warranty/" className="mt-3 inline-block text-sm font-bold text-pine">Warranty</a>
          </article>
        </div>
      </section>

      {questions.length > 0 && (
      <section className="mt-10" aria-labelledby="catalog-questions">
        <h2 id="catalog-questions" className="text-xl font-extrabold tracking-tight">Common questions</h2>
        <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
          {questions.map((item) => (
            <details key={item.q} className="px-5 py-4">
              <summary className="cursor-pointer font-bold">{item.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
      )}

      <section className="mt-10 rounded-3xl bg-ink px-6 py-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-8">
        <div>
          <p className="text-3xl font-extrabold tabular-nums">{formatPrice(product.price)}</p>
        </div>
        <button
          type="button"
          onClick={onBuy}
          disabled={buying}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-cta px-6 text-base font-bold text-white hover:bg-cta-deep disabled:opacity-60 sm:mt-0 sm:w-auto"
        >
          {buying ? 'Starting checkout…' : `Buy now · ${formatPrice(product.price)}`}
        </button>
      </section>
    </div>
  );
};
