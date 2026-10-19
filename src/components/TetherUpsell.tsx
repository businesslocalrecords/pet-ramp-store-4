import React from 'react';
import { formatMoney, money, ADDON_COMPARE_AT, PRODUCT_NAMES } from '../lib/offers';

interface TetherUpsellProps {
  /** Whether the live tether variant loaded from the storefront. */
  available: boolean;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  price: number;
}

/**
 * Post-add-to-cart upsell: car safety tether.
 *
 * Renamed to "Adjustable Car Safety Tether" per the owner's decision (the
 * "crash-tested" wording overstates what the store can evidence). The Shopify
 * handle stays `crash-tested-adjustable-car-safety-tether` so existing carts
 * and the seeder's idempotency keep working — see PRODUCT_HANDLES.
 *
 * The savings figure is computed from the real compare-at price.
 */
export const TetherUpsell: React.FC<TetherUpsellProps> = ({
  available,
  enabled,
  onToggle,
  price,
}) => {
  const compareAt = ADDON_COMPARE_AT.carTether;
  const savings = money(Math.max(0, compareAt - price));

  return (
    <div
      className={`mt-3 flex items-start gap-3 rounded-md border border-gray-300 bg-gray-50 p-4 ${
        available ? '' : 'opacity-60'
      }`}
    >
      <input
        type="checkbox"
        checked={enabled}
        disabled={!available}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-sm border-gray-400 text-pine focus:ring-pine"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Add for ${formatMoney(price)}
          </span>
          <span className="text-[0.8125rem] font-bold text-gray-900">{PRODUCT_NAMES.tether}</span>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          A ramp protects the joints on the way in &mdash; a tether keeps your dog secured for the
          whole drive. Attaches to any harness with a rear clip. Normally ${formatMoney(compareAt)}{' '}
          &mdash;{' '}
          {savings > 0 && <span className="font-bold text-gray-900">save ${formatMoney(savings)}</span>}
          {savings > 0 ? ' on this order.' : ' included with this order.'}
        </p>

        {!available && (
          <p className="mt-1 text-[11px] font-medium text-gray-500">
            Unavailable until the <code>crash-tested-adjustable-car-safety-tether</code> product exists.
          </p>
        )}
      </div>
    </div>
  );
};
