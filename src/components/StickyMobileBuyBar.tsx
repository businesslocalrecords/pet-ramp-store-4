import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { usePurchase } from '../lib/purchase-context';
import { formatMoney } from '../lib/offers';
import { GUARANTEE_LABEL } from '../lib/policy';

/**
 * Mobile-only sticky buy bar. Slides up once the shopper scrolls past the
 * hero so the CTA is always one tap away. Hidden on md and up, where the
 * right-hand purchase column stays sticky instead.
 *
 * Driven by PurchaseProvider, so it shows exactly the same total and performs
 * exactly the same checkout action as the desktop buy button. Styled in the
 * same institutional register: flat orange, solid background, no blur.
 *
 * The green reassurance line under the price is the money-back guarantee
 * (sourced from lib/policy.ts). It previously carried a live stock line with
 * a ship-speed promise ("In stock · ships in 1 business day") — both the
 * dispatch claim and the stock line were removed per owner instruction.
 */
export const StickyMobileBuyBar: React.FC = () => {
  const { total, buying, buy } = usePurchase();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Trigger after roughly one viewport so it never covers the hero CTA
      setVisible(window.scrollY > window.innerHeight * 0.9);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = '5.5rem';
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(28,36,32,0.08)] md:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold leading-none text-gray-900">${formatMoney(total)}</span>
            <span className="text-xs text-gray-500">free shipping</span>
          </div>
          <p className="text-[11px] font-medium text-deal">{GUARANTEE_LABEL}</p>
        </div>

        <button
          type="button"
          onClick={buy}
          disabled={buying}
          className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-full bg-cta px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cta-deep disabled:opacity-60"
        >
          {buying ? (
            'Processing…'
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Buy now
            </>
          )}
        </button>
      </div>
    </div>
  );
};
