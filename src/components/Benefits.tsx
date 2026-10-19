import React from 'react';
import { TrendingDown, ShieldCheck, Feather } from 'lucide-react';
import { RAMP_SIZES, slopeDeg } from '../lib/offers';

interface Benefit {
  icon: React.ElementType;
  title: string;
  body: string;
}

const compact = RAMP_SIZES[0];
const extended = RAMP_SIZES[1];

/**
 * Honest benefit cards — the replacement for the old FeatureBento.
 *
 * Every claim is sourced from published specs (RAMP_SIZES) or computed from
 * them (slopeDeg). The bento version claimed a "vet-approved 24–28° angle"
 * that eliminated "3–4× body-weight impact" — medical language the store
 * cannot substantiate. The slope numbers are now the real ones the SizeGuide
 * computes live: about 23° for the Compact and 20° for the Extended at a
 * 24″ cargo height.
 */
const benefits: Benefit[] = [
  {
    icon: TrendingDown,
    title: 'A gentle slope',
    body: `At a 24\u2033 cargo height the Compact runs about ${Math.round(
      slopeDeg(24, compact.lengthIn)
    )}\u00b0 and the Extended about ${Math.round(
      slopeDeg(24, extended.lengthIn)
    )}\u00b0. The longer the ramp, the gentler the walk \u2014 the size finder below works out the exact angle for your vehicle.`,
  },
  {
    icon: ShieldCheck,
    title: `${compact.weightCapacityLb}\u2013${extended.weightCapacityLb} lb rated`,
    body: `The Compact is published at ${compact.weightCapacityLb} lb and the Extended at ${extended.weightCapacityLb} lb. High side rails run the length of the deck so a nervous dog cannot slip off the edge.`,
  },
  {
    icon: Feather,
    title: 'One-hand carry',
    body: `The Compact weighs ${compact.rampWeightLb} lb, folds in half to ${compact.foldedIn}\u2033 and latches shut \u2014 small enough to store behind a seat.`,
  },
];

/**
 * Three-card benefit grid, editorial register.
 */
export const Benefits: React.FC = () => {
  return (
    <section id="benefits" className="scroll-mt-24">
      <header className="mb-7">
        <span className="inline-flex items-center rounded-full bg-mist px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-pine">
          Why a ramp
        </span>
        <h2 className="mt-3 text-2xl font-bold text-stone-900 sm:text-3xl">
          Built for the walk, not the jump
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {benefits.map((benefit, idx) => (
          <article
            key={idx}
            className="rounded-2xl bg-white p-7 ring-1 ring-gray-900/5"
          >
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-700"
              aria-hidden="true"
            >
              <benefit.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-lg font-bold text-stone-900">{benefit.title}</h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone-600">{benefit.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
