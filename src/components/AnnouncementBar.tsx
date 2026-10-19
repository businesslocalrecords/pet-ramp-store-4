import React from 'react';
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { GUARANTEE_LABEL, WARRANTY_PRODUCT_LABEL } from '../lib/policy';

/**
 * Static announcement bar.
 *
 * This replaces the old UrgencyBar, which had two problems: it advertised a
 * RAMP20 coupon code that no longer exists, and it queried the nonexistent
 * Shopify handle `dog-car-ramp`, so its live-stock scarcity line was dead code
 * that never resolved. (The real handle is `premium-foldable-dog-car-ramp` —
 * see PRODUCT_HANDLES in lib/offers.ts.)
 *
 * The bar is now deliberately STATIC: no countdown timers, no fabricated
 * "people viewing" counters, no coupon codes, and no stock fetching — the buy
 * box shows live stock where it is genuinely low. Every claim here is sourced
 * from lib/policy.ts so it can never drift from the real policy.
 */
export const AnnouncementBar: React.FC = () => {
  return (
    <div className="border-b border-pine-deep bg-pine text-white">
      <div className="mx-auto flex max-w-screen-lg items-center justify-center gap-x-2 px-4 py-2 text-[11px] font-semibold sm:hidden">
        <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Free insured shipping</span>
        <span aria-hidden="true">·</span>
        <span>{GUARANTEE_LABEL}</span>
      </div>
      <div className="mx-auto hidden max-w-screen-lg items-center justify-center gap-x-6 px-4 py-2.5 text-[13px] font-semibold sm:flex">
        <span className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5" aria-hidden="true" />
          Free insured shipping on every order
        </span>
        <span className="text-white/40" aria-hidden="true">|</span>
        <span className="flex items-center gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {GUARANTEE_LABEL}
        </span>
        <span className="text-white/40" aria-hidden="true">|</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {WARRANTY_PRODUCT_LABEL}
        </span>
      </div>
    </div>
  );
};
