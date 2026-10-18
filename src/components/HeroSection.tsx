import React, { useEffect, useRef, useState } from 'react';
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
  const [viewerOpen, setViewerOpen] = useState(false);
  // Read once on mount. This is a client-only SPA, so there is no hydration
  // mismatch to guard against.
  const [dki] = useState(() => readDkiParams());
  const trackRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  const openViewer = (idx: number) => {
    goTo(idx);
    setViewerOpen(true);
  };

  const stepViewer = (delta: number) => {
    goTo((activeIndex + delta + frames.length) % frames.length);
  };

  useEffect(() => {
    if (!viewerOpen) return;
    closeButtonRef.current?.focus();
  }, [viewerOpen]);

  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewerOpen(false);
      if (event.key === 'ArrowRight') goTo((activeIndex + 1) % frames.length);
      if (event.key === 'ArrowLeft') goTo((activeIndex - 1 + frames.length) % frames.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerOpen, activeIndex, frames.length]);

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
                <button
                  type="button"
                  className="block h-full w-full"
                  aria-label={`slide ${idx + 1} of ${frames.length}`}
                  onClick={() => openViewer(idx)}
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
                </button>
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
              aria-label={`slide ${idx + 1} of ${frames.length}`}
              onClick={() => openViewer(idx)}
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

      {viewerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4"
          role="presentation"
          onClick={() => setViewerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="large-photo-title"
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
              <h2 id="large-photo-title" className="text-base font-bold text-stone-900">
                Large view of product photos
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                className="h-10 rounded-full px-3 text-sm font-semibold text-stone-700"
                onClick={() => setViewerOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="relative min-h-0 flex-1 bg-stone-50">
              <div className="aspect-[5/3] w-full">
                {active.kind === 'specs' ? (
                  <SpecsCard />
                ) : (
                  <img
                    src={active.src}
                    alt={active.alt}
                    className={`h-full w-full ${active.fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                    style={active.position ? { objectPosition: active.position } : undefined}
                  />
                )}
              </div>
              <button
                type="button"
                className="absolute left-3 top-1/2 h-11 -translate-y-1/2 rounded-full bg-white px-4 text-sm font-bold shadow"
                onClick={() => stepViewer(-1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 h-11 -translate-y-1/2 rounded-full bg-white px-4 text-sm font-bold shadow"
                onClick={() => stepViewer(1)}
              >
                Next
              </button>
            </div>
            <p className="px-4 py-3 text-sm font-semibold text-stone-600">
              {active.label} · {activeIndex + 1} of {frames.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
