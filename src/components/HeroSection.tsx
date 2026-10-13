import React, { useState } from 'react';
import { readDkiParams } from '../lib/dki';
import { ASSETS } from '../lib/assets';
import { RAMP_SIZES } from '../lib/offers';

interface GalleryFrame {
  src: string;
  alt: string;
  label: string;
  /** 'contain' shows the whole image (no crop) — see ASSETS.heroPhotos. */
  fit?: 'cover' | 'contain';
}

/**
 * Fallback gallery frames — the original SVG renderings from
 * public/assets/product/ (white background — Merchant Center friendly).
 * Used only when ASSETS.heroPhotos is empty; it currently carries the
 * owner's revised six-photo set. Provenance per frame is recorded in
 * claims.md.
 */
const FALLBACK_FRAMES: GalleryFrame[] = [
  {
    src: ASSETS.product.standard,
    alt: 'Compact 62-inch configuration of the PawGrip Pro foldable dog car ramp, side view',
    label: 'Compact \u00b7 62\u2033',
  },
  {
    src: ASSETS.product.extended,
    alt: 'Extended 70-inch configuration of the PawGrip Pro foldable dog car ramp, side view',
    label: 'Extended \u00b7 70\u2033',
  },
];

/**
 * Hero "product block" top — CPC-conversion prototype (informed by
 * elements.html). Changes from the editorial V3 hero:
 *
 *  - The blog byline ("By the PawGrip Pro team · Last updated: …") is gone.
 *    It pushed the headline down and meant nothing to a paid buyer.
 *  - The headline is now the keyword-matched product title the ad was
 *    clicked on (lib/dki.ts — whitelisted values only, never raw URL input)
 *    and leads with the published Compact rating.
 *  - The four-line paragraph is replaced by ONE short supporting line.
 *  - The in-image assurance strip was removed: it repeated the trust claims
 *    already carried once by the announcement bar at the top of the page.
 *
 * Order on mobile is headline -> photo -> (price/button in BuyBox), so the
 * buy box sits as high as possible above the fold.
 */
export const HeroSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  // Read once on mount. This is a client-only SPA, so there is no hydration
  // mismatch to guard against.
  const [dki] = useState(() => readDkiParams());

  const compact = RAMP_SIZES[0];

  const ownerFrames: GalleryFrame[] = ASSETS.heroPhotos.map((photo) => ({
    src: photo.src,
    alt: photo.alt,
    label: photo.label,
    fit: photo.fit,
  }));
  const frames: GalleryFrame[] =
    ownerFrames.length > 0 ? ownerFrames : FALLBACK_FRAMES;
  const active = frames[Math.min(activeIndex, frames.length - 1)];

  return (
    <section id="hero" className="scroll-mt-24">
      {/* DKI headline — keyword-matched to the ad, values are whitelisted,
          never raw URL input (see lib/dki.ts). */}
      <h1 className="text-[1.75rem] leading-[1.1] font-extrabold text-stone-900 sm:text-[2.4rem] lg:text-[2.6rem]">
        {dki.headline}
      </h1>

      {/* One short supporting line — values single-sourced from offers.ts. */}
      <p className="mt-3 text-[1rem] text-stone-600 sm:text-[1.0625rem]">
        Telescopes open in seconds and folds to {compact.foldedIn}&Prime; &mdash; walk
        your dog up instead of lifting.{' '}
        {dki.breedPhrase.charAt(0).toUpperCase() + dki.breedPhrase.slice(1)}.
      </p>

      {/* Gallery */}
      <div className="mt-3 sm:mt-4">
        {/* Main frame */}
        <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-stone-900/10 sm:rounded-2xl">
          <div className="aspect-[3/2] sm:aspect-[4/3]">
            <img
              key={active.src}
              src={active.src}
              alt={active.alt}
              width={1200}
              height={800}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className={`h-full w-full bg-white ${
                active.fit === 'contain' ? 'object-contain' : 'object-cover'
              }`}
            />
          </div>

          {/* Frame label */}
          <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-700 ring-1 ring-stone-900/10 sm:left-4 sm:top-4">
            {active.label}
          </span>
        </div>

        {/* Thumbnails */}
        <div
          className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1 sm:mt-3 sm:gap-3"
          role="tablist"
          aria-label="Product images"
        >
          {frames.map((frame, idx) => (
            <button
              key={frame.src + idx}
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={frame.alt}
              onClick={() => setActiveIndex(idx)}
              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 transition-all duration-200 sm:h-20 sm:w-20 sm:rounded-xl ${
                idx === activeIndex ? 'ring-2 ring-blue-600' : 'ring-stone-900/10 hover:ring-stone-900/20'
              }`}
            >
              <img
                src={frame.src}
                alt=""
                width={160}
                height={160}
                loading="lazy"
                decoding="async"
                className="h-full w-full bg-white object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
