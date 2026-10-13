import React, { useState } from 'react';
import { PawPrint, ShoppingCart } from 'lucide-react';
import { useCart } from '../lib/cart-context';
import { CartDrawer } from './CartDrawer';

/**
 * Sticky header — always visible, pinned to the top.
 *
 * The top-right carries a small "Powered by Shopify" badge with the official
 * Shopify lockup (public/assets/brand/shopify-logo.svg — Shopify supplies this
 * mark precisely for "Powered by Shopify" usage). Every conversion path still
 * lives in the buy box's orange checkout button and the mobile sticky buy bar.
 *
 * It occupies flow space (position: sticky) so the static announcement bar
 * that follows it in the DOM sits under the header at rest, then scrolls away
 * beneath the pinned header on scroll.
 */
export const StickyHeader: React.FC = () => {
  const { totalQuantity } = useCart();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-900/10 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-screen-lg items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900">
            <PawPrint className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <span className="hidden font-extrabold tracking-tight text-stone-900 sm:inline">
            PawGrip Pro
          </span>
        </a>

        <div className="flex items-center gap-3">
          {/* Cart Button */}
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="flex items-center gap-1.5 text-sm text-stone-700 hover:text-stone-900"
            aria-label={totalQuantity > 0 ? `View cart (${totalQuantity} items)` : 'View cart'}
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            {totalQuantity > 0 && (
              <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {totalQuantity}
              </span>
            )}
          </button>

          <span
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1.5"
            title="Powered by Shopify"
          >
            <span className="text-[11px] font-medium leading-none text-stone-500">
              Powered by
            </span>
            <img
              src="/assets/brand/shopify-logo.svg"
              alt="Shopify"
              className="h-4 w-auto"
              loading="eager"
              decoding="async"
            />
          </span>
        </div>
      </div>
      
      {/* Cart Drawer */}
      {cartDrawerOpen && <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />}
    </header>
  );
};
