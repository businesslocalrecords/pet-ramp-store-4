import React from 'react';
import { formatMoney, money, ADDON_PRICES, ADDON_COMPARE_AT, PRODUCT_NAMES } from '../lib/offers';

interface OrderBumpProps {
  /** Live mat variant ID from the Storefront API. */
  matVariantId: string | null;
  /** Whether the bump is currently checked. */
  enabled: boolean;
  /** Called with the new checked state. */
  onToggle: (next: boolean) => void;
  /** Bump price in dollars. */
  price?: number;
}

/**
 * Pre-checkout order bump, rendered as a catalog "add-on item" row rather
 * than a standalone promotional box. It sits inside the same visual register
 * as the tier list so the bump reads as part of the checkout, not a detour.
 *
 * Deliberately a *controlled* toggle: it does not write to the cart on click.
 * The buy handler performs one atomic cart write (ramp + mat together), which
 * avoids a race condition where a fast double-click creates duplicate lines.
 *
 * The "save $X" figure is computed from the real compare-at price
 * (ADDON_COMPARE_AT) — never a hardcoded marketing number.
 */
export const OrderBump: React.FC<OrderBumpProps> = ({
  matVariantId,
  enabled,
  onToggle,
  price = ADDON_PRICES.tractionMat,
}) => {
  const unavailable = !matVariantId;
  const compareAt = ADDON_COMPARE_AT.tractionMat;
  const savings = money(Math.max(0, compareAt - price));

  return (
    <div
      className={`mt-3 flex items-start gap-3 rounded-md border border-gray-300 bg-gray-50 p-4 ${
        unavailable ? 'opacity-60' : ''
      }`}
    >
      {/* Sharp square checkbox */}
      <input
        type="checkbox"
        checked={enabled}
        disabled={unavailable}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-sm border-gray-400 text-pine focus:ring-pine"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Add for ${formatMoney(price)}
          </span>
          <span className="text-[0.8125rem] font-bold text-gray-900">{PRODUCT_NAMES.mat}</span>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Locks the ramp to smooth garage floors and protects your bumper. One-time add-on,
          normally ${formatMoney(compareAt)} &mdash;{' '}
          {savings > 0 && <span className="font-bold text-gray-900">save ${formatMoney(savings)}</span>}
          {savings > 0 ? ' on this order.' : ' included with this order.'}
        </p>

        {unavailable && (
          <p className="mt-1 text-[11px] font-medium text-gray-500">
            Unavailable until the <code>heavy-duty-traction-mat-upgrade-2-pack</code> product exists in Shopify.
          </p>
        )}
      </div>
    </div>
  );
};
