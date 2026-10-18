import React from 'react';
import { Lock } from 'lucide-react';
import { usePurchase } from '../lib/purchase-context';
import {
  formatMoney,
  money,
  PRODUCT_NAMES,
  RAMP_SIZES,
  RAMP_VARIANT_MATCHERS,
} from '../lib/offers';
import { GUARANTEE_LABEL, RETURN_WINDOW_LABEL, POLICY } from '../lib/policy';
import { OrderBump } from './OrderBump';
import { TetherUpsell } from './TetherUpsell';
import { FlatBuyButton } from './FlatBuyButton';

/**
 * Purchase register — the buy box of the product block.
 *
 * CPC-CONVERSION PROTOTYPE (informed by elements.html). This is deliberately
 * a ONE-DECISION register instead of the previous three-tier bundle grid:
 *
 *  - One default ramp (the single ramp, tier 'one'), priced up front with a
 *    modest, honest strikethrough (the real compare-at it was charged at) and
 *    a "Save $x" that equals the strikethrough gap — never an inflated
 *    compare-at next to a token saving.
 *  - Three short, single-sourced bullets (capacity, fold/weight, returns).
 *  - ONE size selector (Compact / Extended). The Extended shows gracefully as
 *    out of stock when Shopify has no available variant for it; the Compact
 *    (the default) is the live, in-stock primary path.
 *  - A solid orange button that runs the real checkout (`buy()`).
 *  - The traction mat and car tether are offered as optional add-ons BELOW the
 *    button. They are no longer ALSO sold as a bundle on this screen, which
 *    was the "mat appears twice" confusion.
 *
 * The value bundles (2 ramps etc.) and their code live in TieredOfferSelector
 * / bundle-discounts.json and are intentionally not surfaced here — surfacing
 * them put a token "Save $5" next to a $169.99-as-separately anchor (see
 * claims.md). Nothing was deleted; the tier selector is simply out of this
 * screen's register.
 *
 * DESIGN: big-box register. Sharp 1px borders, flat action orange, dense
 * tabular layout (see FlatBuyButton). No fabricated rating row — reviews
 * return via the gated Testimonials section once a real source exists.
 */
export const BuyBox: React.FC = () => {
  const {
    tier,
    rampSize,
    setRampSize,
    rampVariants,
    quantity,
    setQuantity,
    maxQuantity,
    bumpEnabled,
    setBumpEnabled,
    bumpPrice,
    showBump,
    tetherUpsell,
    setTetherUpsell,
    tetherPrice,
    showTetherUpsell,
    total,
    loading,
    ready,
    matVariant,
    tetherVariant,
    stock,
    buying,
    error,
    buy,
  } = usePurchase();

  const compact = RAMP_SIZES[0];
  const extended = RAMP_SIZES[1];
  // The single-ramp saving is exactly the strikethrough gap — honest and
  // computed from the real prices (never a hardcoded number).
  const saveAmount = money(tier.compareAt - tier.price);

  const bullets = [
    `Rated to ${compact.weightCapacityLb} lb, with a Paw Grip deck and raised side rails`,
    `${compact.rampWeightLb} lb, folds in half to ${compact.foldedIn}\u2033 and latches shut for the trunk`,
    `${GUARANTEE_LABEL} — a full refund if your dog won't use it`,
  ];

  /**
   * Sizes the loaded Shopify variants can actually fulfil. A size without a
   * matching variant is disabled, never silently substituted — charging the
   * Extended's $40 delta for a Standard variant would be dishonest.
   */
  const variantsLoaded = rampVariants.length > 0;
  const sizeAvailable = (sizeId: string): boolean => {
    if (!variantsLoaded) return false;
    return rampVariants.some(
      (v) => RAMP_VARIANT_MATCHERS[sizeId].test(v.title) && v.availableForSale
    );
  };
  const compactAvailable = sizeAvailable('standard');
  const extendedAvailable = sizeAvailable('extended');
  const anyRampAvailable = rampVariants.some((variant) => variant.availableForSale);

  return (
    <div>
      <h2 className="text-lg font-bold leading-tight text-gray-900">
        {PRODUCT_NAMES.ramp}
      </h2>

      {!ready ? (
        <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
            aria-hidden="true"
          />
          Loading pricing&hellip;
        </div>
      ) : (
        <div className="pt-3">
          {/* Price + honest, consistent strikethrough */}
          <div className="flex items-baseline gap-2">
            <span className="text-[2rem] font-extrabold leading-none tracking-tight text-gray-900">
              ${formatMoney(tier.price)}
            </span>
            <s className="text-base font-medium text-gray-400">
              ${formatMoney(tier.compareAt)}
            </s>
            {saveAmount > 0 && (
              <span className="inline-block bg-[#008C3A] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Save ${formatMoney(saveAmount)}
              </span>
            )}
          </div>

          <div className="mt-1 mb-4 flex items-center gap-2 text-sm">
            {variantsLoaded && !anyRampAvailable ? (
              <span className="font-bold text-red-700">Out of stock</span>
            ) : compactAvailable ? (
              <span className="font-bold text-[#008C3A]">
                {stock !== null && stock > 0 && stock < 20 ? `Only ${stock} left` : 'In stock'}
              </span>
            ) : (
              <span className="font-medium text-gray-500">Checking availability</span>
            )}
            <span className="text-gray-300" aria-hidden="true">
              &middot;
            </span>
            <span className="text-gray-600">Ships free</span>
          </div>

          {/* Three short, single-sourced value points */}
          <ul className="mb-4 grid gap-1.5">
            {bullets.map((line) => (
              <li key={line} className="flex items-start gap-2 text-[0.8125rem] text-gray-700">
                <svg
                  className="mt-1 h-3 w-3 shrink-0 text-[#008C3A]"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 6.5 4.2 9.5 11 2.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          {/* ONE size selector */}
          <fieldset className="mb-4">
            <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
              Size{' '}
              <a
                href="#size-guide"
                className="font-medium normal-case tracking-normal text-blue-700 underline"
              >
                Not sure? Check fit
              </a>
            </legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Ramp size">
              {RAMP_SIZES.map((size) => {
                const isActive = rampSize.id === size.id;
                const available = sizeAvailable(size.id);
                return (
                  <button
                    key={size.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-disabled={!available}
                    disabled={!available}
                    onClick={() => setRampSize(size.id)}
                    className={`flex min-h-12 flex-col justify-center rounded-md border px-3 py-2 text-left transition-colors ${
                      isActive
                        ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                        : available
                          ? 'border-gray-300 bg-white hover:bg-gray-50'
                          : 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <span className={`text-[0.8125rem] font-bold ${isActive ? 'text-gray-900' : 'text-gray-900'}`}>
                      {size.name} &middot; {size.lengthIn}&Prime;
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {size.weightCapacityLb} lb rated
                      {size.priceDelta > 0 && !available && (
                        <span> &middot; Out of stock</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {!extendedAvailable && (
              <p className="mt-1.5 text-[11px] text-gray-500">
                The {extended.name} ({extended.lengthIn}&Prime;) is out of stock right
                now &mdash; the {compact.name} ships now.{' '}
                <a
                  className="font-medium text-blue-700 underline"
                  href={`mailto:pawgrip@businesslocalrecords.com?subject=${encodeURIComponent(
                    `Notify me: Extended ${extended.lengthIn}\u2033 ramp`
                  )}`}
                >
                  Email me when it is back
                </a>
                .
              </p>
            )}
          </fieldset>

          {/* Quantity (ramps only; add-ons stay at one each) */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="ramp-quantity"
              className="text-xs font-bold uppercase tracking-wide text-gray-500"
            >
              Quantity
            </label>
            <select
              id="ramp-quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="min-h-11 rounded-md border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900"
            >
              {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Real checkout button */}
          <FlatBuyButton
            price={total}
            loading={buying || loading}
            disabled={!compactAvailable && !sizeAvailable(rampSize.id)}
            onClick={buy}
          />

          {error && (
            <p role="alert" className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          {/* Optional add-ons — offered after the primary action, never as a
              duplicate of a bundle. */}
          {(showBump || showTetherUpsell) && (
            <div className="mt-4 border-t border-gray-200 pt-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Add before checkout
              </p>
              {showBump && (
                <OrderBump
                  matVariantId={matVariant?.id ?? null}
                  enabled={bumpEnabled}
                  onToggle={setBumpEnabled}
                  price={bumpPrice}
                />
              )}
              {showTetherUpsell && (
                <TetherUpsell
                  available={Boolean(tetherVariant)}
                  enabled={tetherUpsell}
                  onToggle={setTetherUpsell}
                  price={tetherPrice}
                />
              )}
            </div>
          )}

          {/* One short secure/checkout line (the trust strip above carries the
              policy claims once, dark, at the top). */}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-500">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Secure checkout &middot; {POLICY.freeShipping ? 'Free insured shipping' : 'Shipping at checkout'} &middot;{' '}
            {RETURN_WINDOW_LABEL} returns
          </p>
        </div>
      )}
    </div>
  );
};
