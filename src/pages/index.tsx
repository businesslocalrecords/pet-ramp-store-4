import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { StickyHeader } from '../components/StickyHeader';
import { HeroSection } from '../components/HeroSection';
import { BuyBox } from '../components/BuyBox';
import { Benefits } from '../components/Benefits';
import { ComparisonTable } from '../components/ComparisonTable';
import { SizeGuide } from '../components/SizeGuide';
import { ShippingReturns } from '../components/ShippingReturns';
import { Faq } from '../components/Faq';
import { Footer } from '../components/Footer';
import { StickyMobileBuyBar } from '../components/StickyMobileBuyBar';
import { FounderNote } from '../components/FounderNote';
import { PurchaseProvider } from '../lib/purchase-provider';
import { GATES } from '../lib/assets';
import { GUARANTEE_LABEL, WARRANTY_PRODUCT_LABEL } from '../lib/policy';

/* --------------------------------------------------------------------------
   Core Web Vitals: defer below-the-fold sections.
   Video, UGC and reviews are not needed for first paint, so they are
   code-split and only fetched once they are likely to enter the viewport.
   They are additionally gated (assets.ts) so a disabled section never even
   downloads its chunk — see the asset-gate pattern documented there.
   -------------------------------------------------------------------------- */
const VideoProof = lazy(() => import('../components/VideoProof').then((m) => ({ default: m.VideoProof })));
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

/**
 * Single-product landing page — 12-column split-screen layout.
 *
 * Mobile reading order (one column from 390px): hero → size finder → select
 * package (buy column) → why a ramp → the remaining editorial sections.
 * Size first, price second, story third.
 *
 * Vertical rhythm is gap-y-16 everywhere; tap targets are min-h-12; there is
 * no scroll-reveal animation (it hides content on slow devices and hurts
 * Core Web Vitals); prefers-reduced-motion is respected globally in
 * globals.css.
 *
 * At `lg` the `lg:order-*` values restore today's editorial sequence
 * (hero, benefits, comparison, size guide, founder, badges, shipping, faq)
 * while the buy column takes explicit grid placement — `col-start-8`
 * spanning `row-span-full` so the sticky purchase column stays glued for
 * the full page.
 */
const Page: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-stone-900 antialiased selection:bg-blue-200 selection:text-stone-900">
      {/* Glass header — pinned to the top, always visible, follows the scroll */}
      <StickyHeader />

      {/* Static announcement bar — sits under the header and scrolls away with
          the page (it slides under the pinned header as you scroll) */}
      <AnnouncementBar />

      <main className="mx-auto max-w-screen-lg px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-12 lg:gap-x-12">
          {/* ---------------- HERO (mobile 1 | desktop 1) ----------------
              CPC prototype: headline -> photo come first on mobile so the buy
              box below reaches the first screen. */}
          <div className="order-1 lg:col-span-7 lg:order-1">
            <HeroSection />
          </div>

          {/* ---------------- SIZE FINDER (mobile 4 | desktop 6) ----------------
              Moved below the product block; the buy box links here ("Not
              sure? Check fit"). */}
          <div className="order-3 lg:col-span-7 lg:order-6">
            <SizeGuide />
          </div>

          {/* ---------------- RIGHT: sticky buy column (mobile 2) ----------------
              Price + button now sit right under the hero on mobile, before the
              size finder and the long editorial sections. */}
          <aside className="order-2 lg:col-start-8 lg:col-span-5 lg:row-span-full">
            <div
              id="offer"
              className="lg:sticky lg:top-24"
            >
              <div className="mx-auto max-w-lg rounded-md border border-gray-300 bg-white p-6 shadow-sm">
                <BuyBox />
              </div>

              <p className="mt-4 text-center text-xs text-stone-500">
                Free insured shipping &middot; {GUARANTEE_LABEL} &middot; {WARRANTY_PRODUCT_LABEL}
              </p>
            </div>
          </aside>

          {/* ---------------- WHY A RAMP (mobile 4 | desktop 4) ---------------- */}
          <div className="order-4 lg:col-span-7 lg:order-4">
            <Benefits />
          </div>

          {/* ---------------- HEAD TO HEAD (mobile 5 | desktop 5) ---------------- */}
          <div className="order-5 lg:col-span-7 lg:order-5">
            <ComparisonTable />
          </div>

          {GATES.videoProof && (
            <div className="lg:col-span-7 lg:order-2">
              <Suspense fallback={<SectionFallback label="the demo video" />}>
                <VideoProof />
              </Suspense>
            </div>
          )}

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

          {/* ---------------- SHIPPING (desktop 9) ---------------- */}
          <div className="order-7 lg:col-span-7 lg:order-9">
            <ShippingReturns />
          </div>

          {/* ---------------- FAQ (desktop 10) ---------------- */}
          <div className="order-8 lg:col-span-7 lg:order-10">
            <Faq />
          </div>
        </div>
      </main>

      {/* Mobile-only sticky buy bar (needs the shared purchase context) */}
      <StickyMobileBuyBar />

      <Footer />
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
