import React, { useRef, useState } from 'react';
import { readDkiParams } from '../lib/dki';
import { ASSETS, type HeroPhoto } from '../lib/assets';
import { RAMP_SIZES } from '../lib/offers';

/**
 * Fallback gallery frames — the original SVG renderings from
 * public/assets/product/ (white background — Merchant Center friendly).
 * Used only when ASSETS.heroPhotos is empty. Provenance per frame is
 * recorded in claims.md.
 */
const FALLBACK_FRAMES: HeroPhoto[] = [
  {
    src: ASSETS.product.standard,
    alt: 'Compact 62-inch configuration of the Paw-Grip foldable dog car ramp, side view',
    label: 'Compact \u00b7 62\u2033',
    fit: 'contain',
  },
  {
    src: ASSETS.product.extended,
    alt: 'Extended 70-inch configuration of the Paw-Grip foldable dog car ramp, side view',
    label: 'Extended \u00b7 70\u2033',
    fit: 'contain',
  },
];

/**
 * The gallery's "Specs" frame — real text from offers.ts, readable at any
 * size (the owner's spec-sheet image prints its numbers too small to read
 * inside the gallery).
 */
const SpecsCard: React.FC = () => {
  const compact = RAMP_SIZES[0];
  const rows: [string, string][] = [
    ['Open', `${compact.lengthIn}\u2033 L \u00d7 ${compact.widthIn}\u2033 W \u00d7 ${compact.deckHeightIn}\u2033 H`],
    ['Folded', `${compact.foldedIn}\u2033 L \u00d7 ${compact.widthIn}\u2033 W`],
    ['Weight capacity', `${compact.weightCapacityLb} lb`],
    ['Ramp weight', `${compact.rampWeightLb} lb`],
    ['Deck', 'Paw-Grip grit surface, raised side rails'],
    ['Storage', 'Folds in half, safety latch'],
  ];
  return (
    <div className="flex h-full w-full flex-col justify-center bg-stone-50 px-5 sm:px-8">
      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
        {compact.name} &middot; specifications
      </p>
      <dl className="mt-2 divide-y divide-stone-200 text-[0.8125rem] sm:mt-3 sm:text-[0.9375rem]">
        {rows.map(([term, value]) => (
          <div key={term} className="flex justify-between gap-4 py-1 sm:py-1.5">
            <dt className="text-stone-500">{term}</dt>
            <dd className="text-right font-bold text-stone-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

/**
 * Photos matching the ad's vehicle keyword move to the front; the rest keep
 * their order. Nothing is filtered out — every visitor can see every photo.
 */
function orderForVehicle(frames: readonly HeroPhoto[], vehicleKey: string | null): HeroPhoto[] {
  if (!vehicleKey) return [...frames];
  const matches = frames.filter((f) => f.vehicles?.includes(vehicleKey));
  return [...matches, ...frames.filter((f) => !matches.includes(f))];
}

/**
 * Hero "product block" top — CPC-conversion layout:
 *
 *  - The headline is the keyword-matched product title the ad was clicked on
 *    (lib/dki.ts — whitelisted values only, never raw URL input).
 *  - ONE supporting line: the pain solved (lifting), the differentiator
 *    (grit deck) and the fold. Specs beyond that live in the buy box.
 *  - Gallery: a 5:3 swipeable strip. Phones swipe; thumbnails jump. The
 *    label sits under the photo so it never covers baked-in text.
 *
 * Nothing else lives here: on mobile the buy box follows directly, so every
 * line added to the hero pushes "Proceed to Checkout" further down.
 */
export const HeroSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  // Read once on mount. This is a client-only SPA, so there is no hydration
  // mismatch to guard against.
  const [dki] = useState(() => readDkiParams());
  const trackRef = useRef<HTMLDivElement>(null);

  const compact = RAMP_SIZES[0];

  const frames = orderForVehicle(
    ASSETS.heroPhotos.length > 0 ? ASSETS.heroPhotos : FALLBACK_FRAMES,
    dki.vehicleKey
  );
  const active = frames[Math.min(activeIndex, frames.length - 1)];

  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const goTo = (idx: number) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
    setActiveIndex(idx);
  };

  return (
    <section id="hero" className="scroll-mt-24">
      {/* DKI headline — keyword-matched to the ad, values are whitelisted,
          never raw URL input (see lib/dki.ts). */}
      <h1 className="text-[1.75rem] leading-[1.1] font-extrabold text-stone-900 sm:text-[2.4rem] lg:text-[2.6rem]">
        {dki.headline}
      </h1>

      {/* One short supporting line — values single-sourced from offers.ts. */}
      <p className="mt-3 text-[1rem] text-stone-600 sm:text-[1.0625rem]">
        Stop lifting your dog into the {dki.vehicleInline}. The Paw-Grip deck gives
        paws real traction, and the {compact.rampWeightLb}&nbsp;lb ramp folds in half
        to {compact.foldedIn}&Prime; for the trunk.
      </p>

      {/* Gallery */}
      <div className="mt-3 sm:mt-4">
        <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-stone-900/10 sm:rounded-2xl">
          <div
            ref={trackRef}
            onScroll={onTrackScroll}
            className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto"
            aria-live="polite"
          >
            {frames.map((frame, idx) => (
              <div
                key={frame.src}
                className="aspect-[5/3] w-full shrink-0 snap-center"
                style={frame.fit === 'contain' ? { backgroundColor: frame.bg ?? '#ffffff' } : undefined}
                aria-hidden={idx !== activeIndex}
              >
                {frame.kind === 'specs' ? (
                  <SpecsCard />
                ) : (
                <img
                  src={frame.src}
                  alt={frame.alt}
                  width={1000}
                  height={600}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  decoding="async"
                  draggable={false}
                  className={`h-full w-full ${frame.fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                  style={frame.position ? { objectPosition: frame.position } : undefined}
                />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Caption + position — tells phone visitors there is more to swipe */}
        <div className="mt-1.5 flex items-center justify-between px-0.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">
          <span>{active.label}</span>
          <span className="tabular-nums font-medium normal-case tracking-normal">
            {activeIndex + 1} / {frames.length}
          </span>
        </div>

        {/* Thumbnails */}
        <div
          className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Product images"
        >
          {frames.map((frame, idx) => (
            <button
              key={frame.src}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={frame.alt}
              onClick={() => goTo(idx)}
              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 transition-shadow duration-200 sm:h-14 sm:w-14 sm:rounded-xl ${
                idx === activeIndex ? 'ring-2 ring-blue-600' : 'ring-stone-900/10 hover:ring-stone-900/20'
              }`}
              style={frame.fit === 'contain' ? { backgroundColor: frame.bg ?? '#ffffff' } : undefined}
            >
              {frame.kind === 'specs' ? (
                <span className="flex h-full w-full items-center justify-center bg-stone-900 text-[10px] font-bold uppercase tracking-wider text-white">
                  Specs
                </span>
              ) : (
                <img
                  src={frame.src}
                  alt=""
                  width={128}
                  height={128}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full ${frame.fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
