import React, { useEffect } from 'react';
import { Lock, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCart } from '../lib/cart-context';
import { formatMoney } from '../lib/offers';
import { collectAttributionParams, appendAttribution } from '../lib/dki';
import { trackBeginCheckout, pushBeginCheckoutDataLayer } from '../lib/analytics';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Cart drawer — a right-side slide-over.
 *
 * FIXED (2026-10-13). The previous version had two bugs that made clicking the
 * cart "do something random":
 *
 *  1. LAYOUT: the wrapper was `fixed inset-0 flex items-end` (a bottom-sheet)
 *     while the panel itself was `h-full max-w-xs` inside a nested centered row
 *     — a bottom-anchored container fighting a full-height side panel, so it
 *     rendered full-height and misaligned. This is now a single, predictable
 *     right-side slide-over: one absolute panel, no conflicting flex anchors.
 *
 *  2. CHECKOUT TARGET: the footer button called `buy()`, which ignores the
 *     drawer and rebuilds a fresh cart from the buy box's current tier/size/
 *     add-on state. If the drawer showed one item while the buy box was on a
 *     different selection, "Checkout" sent a different cart than the one shown.
 *     It now checks out THIS cart's real Shopify `checkoutUrl` (attribution
 *     forwarded, same as the buy box), so what you see is what gets paid for.
 *
 * Dismiss: backdrop click, the X button, or the Escape key.
 */
export const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose }) => {
  const { cart, loading, error, updateQuantity, removeItem } = useCart();

  // Escape closes the drawer. Registered only while open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const lines = cart?.lines.edges ?? [];
  const totalQuantity = cart?.totalQuantity ?? 0;
  const hasItems = totalQuantity > 0;

  const handleQuantity = async (lineId: string, next: number) => {
    try {
      await updateQuantity(lineId, next);
    } catch {
      // The cart's own `error` state surfaces inline; nothing else to do.
    }
  };

  const handleRemove = async (lineId: string) => {
    try {
      await removeItem(lineId);
    } catch {
      // The cart's own `error` state surfaces inline; nothing else to do.
    }
  };

  /**
   * Check out the cart that is actually shown, via its real Shopify checkout
   * link. Attribution (gclid/utm/…) is forwarded exactly as the buy box does,
   * then we redirect. We deliberately do NOT call `buy()` here (see header).
   */
  const handleCheckout = () => {
    if (!cart || !hasItems || !cart.checkoutUrl) return;

    const currency = cart.cost.totalAmount.currencyCode;
    const items = lines.map(({ node }) => ({
      item_id: node.merchandise.id,
      item_name: `${node.merchandise.product.title} - ${node.merchandise.title}`,
      price: Number(node.cost.totalAmount.amount) / node.quantity,
      quantity: node.quantity,
    }));

    trackBeginCheckout(items, currency);
    pushBeginCheckoutDataLayer(items, currency);

    window.location.assign(
      appendAttribution(cart.checkoutUrl, collectAttributionParams())
    );
  };

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      {/* Backdrop — click to close */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Slide-over panel: single right-side anchor, no conflicting flex */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <ShoppingCart className="h-4 w-4 text-gray-500" aria-hidden="true" />
            Your Cart{hasItems ? ` (${totalQuantity})` : ''}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">Loading cart…</p>
          ) : error ? (
            <p role="alert" className="py-8 text-center text-sm font-medium text-red-600">
              {error}
            </p>
          ) : !hasItems ? (
            <p className="py-8 text-center text-sm text-gray-500">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {lines.map(({ node }) => {
                const lineTotal = parseFloat(node.cost.totalAmount.amount);
                const each = lineTotal / node.quantity;
                return (
                  <li
                    key={node.id}
                    className="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {node.merchandise.product.title}
                      </p>
                      {node.merchandise.title !== 'Default Title' && (
                        <p className="text-xs text-gray-500">{node.merchandise.title}</p>
                      )}

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuantity(node.id, node.quantity - 1)}
                          disabled={node.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-medium text-gray-900">
                          {node.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantity(node.id, node.quantity + 1)}
                          aria-label="Increase quantity"
                          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(node.id)}
                          aria-label={`Remove ${node.merchandise.product.title}`}
                          className="ml-auto flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-gray-900">${formatMoney(each)}</p>
                      <p className="text-[11px] text-gray-500">each</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-4">
          {hasItems && cart ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-bold text-gray-900">
                  ${formatMoney(parseFloat(cart.cost.subtotalAmount.amount))}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#F37021] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#D95E1A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                Proceed to Checkout
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full text-center text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Continue shopping
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          )}
        </div>

      </aside>
    </div>
  );
};
