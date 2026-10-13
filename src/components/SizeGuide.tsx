import React, { useState } from 'react';
import { Ruler, CheckCircle2, Dog } from 'lucide-react';
import { usePurchase } from '../lib/purchase-context';
import {
  RAMP_SIZES,
  slopeDeg,
  recommendSize,
  formatMoney,
  type RampSize,
} from '../lib/offers';
import { trackSizeFinderUsed } from '../lib/analytics';

/**
 * Practical pitch per size — why you'd pick it, in plain language.
 *
 * Degree angles and slope formulas deliberately live outside the UI: owners
 * decide on fit and practicality, not trigonometry (owner instruction; the
 * change is recorded in claims.md). The angle still travels to analytics
 * where it is genuinely useful.
 */
const SIZE_PITCH: Record<RampSize['id'], { badge: string; pitch: string }> = {
  standard: {
    badge: 'Most popular',
    pitch:
      'The one almost everyone picks — and stays happy with. Lighter to carry, and it folds small enough for most trunks.',
  },
  extended: {
    badge: 'For taller vehicles',
    pitch:
      'A longer reach and more capacity for trucks, lifted SUVs and vans. A bit longer and heavier to store, so pick it only when the Compact would be too steep for your tailgate.',
  },
};

/**
 * Size finder.
 *
 * Leads with the Compact: it is the size nearly every owner chooses, and the
 * section says so in plain language. The cargo-height slider is the only
 * input — slide it and the card for the size that fits your vehicle is
 * highlighted, without exposing slope math.
 *
 * "Select {Size}" writes the choice into the shared purchase context (which
 * resolves the matching Shopify variant) and scrolls to the offer box.
 */
export const SizeGuide: React.FC = () => {
  const { rampSize, setRampSize } = usePurchase();
  const [heightIn, setHeightIn] = useState(24);

  const handleSelect = (size: RampSize) => {
    setRampSize(size.id);
    trackSizeFinderUsed({
      size: size.id,
      vehicleHeightIn: heightIn,
      slopeDeg: Number(slopeDeg(heightIn, size.lengthIn).toFixed(1)),
    });
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('offer')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <section id="size-guide" className="scroll-mt-24 py-12 sm:py-16">
      <header className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-800">
          <Ruler className="h-3.5 w-3.5" aria-hidden="true" /> Size finder
        </span>
        <h2 className="mt-3 text-2xl font-bold text-stone-900 sm:text-3xl">
          Most owners pick the 62&Prime; Compact
        </h2>
        <p className="mt-2 max-w-xl text-stone-600">
          It fits sedans, hatchbacks and ordinary SUVs, it is the lighter one to carry, and
          almost every customer who buys one is happy with it. The 70&Prime; Extended is there
          for genuinely tall vehicles &mdash; trucks, lifted SUVs and vans &mdash; where the
          Compact would be too steep or too short.
        </p>
      </header>

      {/* Height input — a practical verdict, not a math worksheet */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label htmlFor="vehicle-height" className="block text-sm font-bold text-stone-900">
              Vehicle cargo height
            </label>
            <p className="mt-1 text-xs text-stone-500">
              Ground to the bumper or cargo floor your dog steps onto.
            </p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-extrabold tabular-nums text-stone-900">{heightIn}</span>
            <span className="ml-1 text-lg font-bold text-stone-400">in</span>
          </div>
        </div>

        <input
          id="vehicle-height"
          type="range"
          min={18}
          max={42}
          step={1}
          value={heightIn}
          onChange={(e) => setHeightIn(Number(e.target.value))}
          className="mt-4 h-12 w-full cursor-pointer accent-blue-700"
          aria-describedby="vehicle-height-help"
        />
        <div className="flex justify-between text-[11px] font-medium text-stone-400">
          <span>18&Prime; (low sedan)</span>
          <span>42&Prime; (lifted truck)</span>
        </div>
        <p id="vehicle-height-help" className="mt-3 text-sm text-stone-600">
          Slide your ground-to-bumper height and we highlight the size that fits your
          vehicle. Select that card to choose it &mdash; your choice appears in the offer
          box above.
        </p>
      </div>

      {/* Size cards */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {RAMP_SIZES.map((size) => {
          const isRecommended = recommendSize(heightIn).id === size.id;
          const isSelected = rampSize.id === size.id;
          const pitch = SIZE_PITCH[size.id];
          return (
            <div
              key={size.id}
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 transition-colors ${
                isRecommended ? 'border-stone-900' : 'border-stone-200'
              }`}
            >
              <span className="absolute -top-3 left-6 bg-stone-900 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                {pitch.badge}
              </span>

              <div className="mb-2 flex items-center gap-2.5">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                </div>
                <h3 className="text-lg font-bold text-stone-900">
                  {size.tierName} &middot; {size.lengthIn}&Prime;
                </h3>
                <Dog
                  className={`ml-auto h-6 w-6 ${isRecommended ? 'text-amber-600' : 'text-stone-300'}`}
                  aria-hidden="true"
                />
              </div>

              <p className="text-sm leading-relaxed text-stone-600">{pitch.pitch}</p>

              {/* Practical specs only — capacities, sizes, fit */}
              <dl className="mt-4 space-y-2.5 border-t border-stone-200 pt-4 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-stone-500">Weight capacity</dt>
                  <dd className="font-bold text-stone-900">{size.weightCapacityLb} lb</dd>
                </div>
                {size.rampWeightLb !== null && (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-stone-500">Ramp weight</dt>
                    <dd className="font-bold text-stone-900">{size.rampWeightLb} lb</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-stone-500">Open dimensions</dt>
                  <dd className="text-right text-xs font-semibold text-stone-800">
                    {size.lengthIn}&Prime; L &times; {size.widthIn}&Prime; W
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-stone-500">Folded size</dt>
                  <dd className="text-xs font-semibold text-stone-800">{size.foldedIn}&Prime; folded</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-stone-500">Best for</dt>
                  <dd className="max-w-[60%] text-right text-xs font-medium text-stone-700">
                    {size.vehicleType}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-200 pt-4">
                <span className="text-sm font-bold text-stone-900">
                  {size.priceDelta > 0 ? `+$${formatMoney(size.priceDelta)}` : 'Included in every bundle'}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelect(size)}
                  className={`flex min-h-12 items-center rounded-md px-5 text-sm font-bold transition-colors ${
                    isSelected
                      ? 'bg-stone-900 text-white hover:bg-stone-800'
                      : 'bg-[#F37021] text-white hover:bg-[#D95E1A]'
                  }`}
                >
                  {isSelected ? 'Selected' : `Select ${size.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* The slope-guide chart and the rating badge that used to sit under
          the cards were removed per owner instruction. Their files moved to
          public/assets/old-assets/. */}
    </section>
  );
};
