import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { HeroSection } from '../components/HeroSection';
import { BuyBox } from '../components/BuyBox';
import { QuickAnswers } from '../components/QuickAnswers';
import { AboutItem } from '../components/AboutItem';
import { SizeGuide } from '../components/SizeGuide';
import { MoreRamps } from '../components/MoreRamps';
import { ShippingReturns } from '../components/ShippingReturns';
import { Faq } from '../components/Faq';
import { StickyMobileBuyBar } from '../components/StickyMobileBuyBar';
import { FounderNote } from '../components/FounderNote';
import { PurchaseProvider } from '../lib/purchase-provider';
import { GATES } from '../lib/assets';
import { findBySlug, formatPrice, productPath, relatedProducts } from '../lib/catalog';
import { GUARANTEE_LABEL, WARRANTY_PRODUCT_LABEL } from '../lib/policy';
import { Stars } from '../components/Stars';
import { usePageMeta } from '../lib/use-page-meta';

/* --------------------------------------------------------------------------
   Core Web Vitals: defer below-the-fold sections.
   Video, UGC and reviews are not needed for first paint, so they are
   code-split and only fetched once they are likely to enter the viewport.
   They are additionally gated (assets.ts) so a disabled section never even
   downloads its chunk — see the asset-gate pattern documented there.
   -------------------------------------------------------------------------- */
const UGCGallery = lazy(() => import('../components/UGCGallery').then((m) => ({ default: m.UGCGallery })));
const Testimonials = lazy(() => import('../components/Testimonials').then((m) => ({ default: m.Testimonials })));

/** Placeholder shown while a deferred chunk loads. */
const SectionFallback: React.FC<{ label: string }> = ({ label }) => (
  <div
    className="flex items-center justify-center gap-2 rounded-2xl bg-stone-50 py-16 text-sm text-stone-400"
    role="status"
    aria-live="polite"
  >
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
    Loading {label}&hellip;
  </div>
);

/** Space kept clear above the pinned buy column (lg:top-24 = 6rem). */
const STICKY_TOP_PX = 96;

/**
 * The desktop buy column pins only while it fits in the viewport. A sticky
 * box taller than the screen hides its own bottom (the quick answers) and
 * re-pins on every height change, which reads as jitter.
 */
function useFitsViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [fits, setFits] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setFits(el.offsetHeight + STICKY_TOP_PX + 16 <= window.innerHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return [ref, fits] as const;
}

/**
 * Single-product landing page — 12-column split-screen layout.
 *
 * Mobile reading order (one column from 390px): hero → size finder → select
 * package (buy column) → the remaining editorial sections.
 * Size first, price second, story third.
 *
 * Vertical rhythm is gap-y-16 everywhere; tap targets are min-h-12; there is
 * no scroll-reveal animation (it hides content on slow devices and hurts
 * Core Web Vitals); prefers-reduced-motion is respected globally in
 * globals.css.
 *
 * At `lg` the `lg:order-*` values restore today's editorial sequence
 * (hero, size guide, founder, related products, shipping, faq)
 * while the buy column takes explicit grid placement — `col-start-8`
 * spanning `row-span-full` so the sticky purchase column stays glued for
 * the full page.
 */
const Page: React.FC = () => {
  const [offerRef, offerFits] = useFitsViewport<HTMLDivElement>();
  const { search } = useLocation();
  const similar = findBySlug('side-door-pet-steps');
  const ramp = findBySlug('foldable-dog-car-ramp');
  const related = ramp ? relatedProducts(ramp) : [];
  usePageMeta('/products/foldable-dog-car-ramp');

  return (
    <div className="bg-white text-ink antialiased selection:bg-mist selection:text-ink">
      <main className="mx-auto max-w-screen-lg px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-pine">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link to="/dog-ramps" className="hover:text-pine">Dog ramps</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-stone-900">Foldable dog car ramp</span>
        </nav>
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-12 lg:gap-x-12">
          {/* ---------------- HERO (mobile 1 | desktop 1) ----------------
              CPC prototype: headline -> photo come first on mobile so the buy
              box below reaches the first screen. */}
          <div className="order-1 lg:col-span-7 lg:order-1">
            <HeroSection />
          </div>

          {/* ---------------- ABOUT THIS ITEM (mobile 3 | desktop 1) ----------------
              Retail product-detail panels: right after the buy area on
              mobile, under the gallery on desktop. */}
          <div className="order-3 lg:col-span-7 lg:order-1">
            <AboutItem />
            <div className="mt-6">
              <QuickAnswers />
            </div>
          </div>

          {/* ---------------- SIZE FINDER (mobile 4 | desktop 6) ----------------
              Moved below the product block; the buy box links here ("Not
              sure? Check fit"). */}
          <div className="order-3 lg:col-span-7 lg:order-6">
            <SizeGuide />
          </div>

          {/* ---------------- RIGHT: sticky buy column (mobile 2) ----------------
              Price + button now sit right under the hero on mobile, before the
              size finder and the long editorial sections. On desktop it spans
              the left column's rows (row-span-full only covers explicit rows,
              of which there are none) so the left sections stack beside it. */}
          <aside className="order-2 lg:col-start-8 lg:col-span-5 lg:row-start-1 lg:row-span-8">
            <div
              id="offer"
              ref={offerRef}
              className={offerFits ? 'lg:sticky lg:top-24' : undefined}
            >
              <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-6 shadow-sm">
                <BuyBox />
                {similar && (
                  <Link
                    to={{ pathname: productPath(similar), search }}
                    className="mt-5 flex gap-3 rounded-xl border border-line p-3 hover:border-pine"
                  >
                    <img
                      src={similar.image}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-lg bg-well object-contain"
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wide text-muted">
                        Similar item
                      </span>
                      <span className="mt-1 block text-sm font-bold leading-snug text-stone-900">
                        {similar.name}
                      </span>
                      <Stars value={similar.rating} count={similar.ratingCount} />
                      <span className="mt-1 block text-base font-extrabold tabular-nums">
                        {formatPrice(similar.price)}
                      </span>
                    </span>
                  </Link>
                )}
              </div>

              <p className="mt-4 text-center text-xs text-stone-500">
                Free insured shipping &middot; {GUARANTEE_LABEL} &middot; {WARRANTY_PRODUCT_LABEL}
              </p>
            </div>
          </aside>

          {GATES.ugcGallery && (
            <div className="lg:col-span-7 lg:order-3">
              <Suspense fallback={<SectionFallback label="owner videos" />}>
                <UGCGallery />
              </Suspense>
            </div>
          )}

          {GATES.testimonials && (
            <div className="lg:col-span-7 lg:order-7">
              <Suspense fallback={<SectionFallback label="reviews" />}>
                <Testimonials />
              </Suspense>
            </div>
          )}

          {/* ---------------- FOUNDER NOTE (desktop 8) ---------------- */}
          <div className="order-6 lg:col-span-7 lg:order-8">
            <FounderNote />
          </div>

          {/* Related cards sit immediately before shipping on every product page. */}
          <div className="order-7 lg:col-span-7 lg:order-9">
            <MoreRamps products={related} className="" gridClassName="grid-cols-2" />
          </div>

          {/* ---------------- SHIPPING (desktop 10) ---------------- */}
          <div className="order-8 lg:col-span-7 lg:order-10">
            <ShippingReturns />
          </div>

          {/* ---------------- FAQ (desktop 11) ---------------- */}
          <div className="order-9 lg:col-span-7 lg:order-11">
            <Faq />
          </div>
        </div>
      </main>

      {/* Mobile-only sticky buy bar (needs the shared purchase context) */}
      <StickyMobileBuyBar />
    </div>
  );
};

/** Wraps the page in the shared purchase context. */
const PageWithProviders: React.FC = () => (
  <PurchaseProvider>
    <Page />
  </PurchaseProvider>
);

export default PageWithProviders;
