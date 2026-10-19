import React from 'react';
import { TIERS, formatMoney, bundleSavings } from '../lib/offers';

interface TieredOfferSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

/**
 * Good / Better / Best bundle selector, big-box register.
 *
 * Options stack directly with 1px dividers instead of floating as separate
 * cards, so the group reads as one connected decision table. The radio is a
 * native input so it is keyboard accessible and renders as a sharp circle.
 *
 * V3 HONESTY RULES
 * ----------------
 * - The MOST POPULAR / BEST VALUE labels are gone. Tier 'one' is the default
 *   (see DEFAULT_TIER_ID) so no tier needs a manufactured rank.
 * - "Save $x vs buying separately" is computed live from the individual item
 *   prices (bundleSavings) and renders ONLY when the number is genuinely
 *   positive. Tier 'one' saves nothing against itself, so it shows no badge.
 * - The compare-at price stays (owner decision, see claims.md) but renders
 *   muted and small: it anchors value without shouting "discount warehouse".
 */
export const TieredOfferSelector: React.FC<TieredOfferSelectorProps> = ({
  selectedId,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="overflow-hidden rounded-md border border-gray-300 bg-white">
      {TIERS.map((tier, index) => {
        const isActive = selectedId === tier.id;
        const savings = bundleSavings(tier);

        return (
          <label
            key={tier.id}
            className={`flex cursor-pointer items-start p-4 transition-colors ${
              index < TIERS.length - 1 ? 'border-b border-gray-200' : ''
            } ${isActive ? 'bg-mist/60' : 'hover:bg-gray-50'} ${
              disabled ? 'cursor-not-allowed opacity-60' : ''
            }`}
          >
            {/* Native radio — sharp, not a custom dot */}
            <input
              type="radio"
              name="package"
              value={tier.id}
              checked={isActive}
              disabled={disabled}
              onChange={() => onSelect(tier.id)}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer border-gray-400 text-pine focus:ring-pine"
            />

            <div className="ml-4 flex-1">
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`text-[0.9375rem] font-bold ${isActive ? 'text-pine-deep' : 'text-gray-900'}`}
                >
                  {tier.label}
                </span>

                <div className="shrink-0 text-right">
                  <span className="block text-lg font-bold leading-none text-gray-900">
                    ${formatMoney(tier.price)}
                  </span>
                  {/* Subtle compare-at anchor — muted, small, struck */}
                  <span className="mt-0.5 block text-xs font-medium text-gray-400 line-through">
                    ${formatMoney(tier.compareAt)}
                  </span>
                </div>
              </div>

              {/* Savings badge only when the bundle genuinely saves money */}
              {savings > 0 && (
                <div className="mt-1.5">
                  <span className="inline-block bg-deal px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    Save ${formatMoney(savings)} vs buying separately
                  </span>
                </div>
              )}

              {/* Sub-items / what this tier contains */}
              <p className="mt-2 text-xs leading-relaxed text-gray-600">{tier.sublabel}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{tier.perks[0]}</p>
              {tier.perks.length > 1 && (
                <p className="mt-0.5 text-xs text-gray-400">
                  +{tier.perks.length - 1} more included
                </p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};
