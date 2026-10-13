import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useCart } from './cart-context';
import { fetchProductByHandle, fetchProductStock, type ProductVariantEdge } from './shopify';
import { collectAttributionParams, appendAttribution } from './dki';
import { trackAddToCart, trackBeginCheckout, pushBeginCheckoutDataLayer } from './analytics';
import {
  DEFAULT_TIER_ID,
  getTier,
  getRampSize,
  DEFAULT_RAMP_SIZE_ID,
  RAMP_VARIANT_MATCHERS,
  PRODUCT_HANDLES,
  ADDON_PRICES,
  money,
  getBundleDiscount,
} from './offers';
import { PurchaseContext, type PurchaseContextValue } from './purchase-context';

const BUMP_PRICE = ADDON_PRICES.tractionMat;

type Variant = ProductVariantEdge['node'];

/**
 * Single source of truth for the purchase flow.
 *
 * Both the desktop buy box and the mobile sticky buy bar call the same `buy()`,
 * so there is exactly one place that writes to the cart, fires conversion
 * events, and forwards attribution into the Shopify checkout.
 *
 * V3 CHANGES
 * ----------
 * - The RAMP20 coupon code is gone. It was hardcoded here and pushed into the
 *   begin_checkout dataLayer; the discount now comes only from the real
 *   compare-at anchor (see lib/offers.ts and claims.md).
 * - Size selection: the SizeGuide (and the buy box's size row) pick which
 *   Shopify variant fulfils the order. The Extended variant carries a $40
 *   delta, applied to the ramp line price and the live total.
 */
export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { startCheckout, loading: cartLoading } = useCart();

  const [selectedId, setSelectedId] = useState(DEFAULT_TIER_ID);
  const [rampSizeId, setRampSizeId] = useState(DEFAULT_RAMP_SIZE_ID);
  const [bumpEnabled, setBumpEnabled] = useState(false);
  const [tetherUpsell, setTetherUpsell] = useState(false);

  const [rampVariants, setRampVariants] = useState<Variant[]>([]);
  const [matVariant, setMatVariant] = useState<Variant | null>(null);
  const [tetherVariant, setTetherVariant] = useState<Variant | null>(null);
  const [stock, setStock] = useState<number | null>(null);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ramp, mat, tether, stockLevel] = await Promise.all([
          fetchProductByHandle(PRODUCT_HANDLES.heroRamp),
          fetchProductByHandle(PRODUCT_HANDLES.tractionMat),
          fetchProductByHandle(PRODUCT_HANDLES.carTether),
          fetchProductStock(PRODUCT_HANDLES.heroRamp),
        ]);
        if (cancelled) return;

        if (ramp) setRampVariants(ramp.variants.edges.map((e) => e.node));
        if (mat) {
          const variants = mat.variants.edges.map((e) => e.node);
          setMatVariant(variants.find((v) => v.availableForSale) ?? null);
        }
        if (tether) {
          const variants = tether.variants.edges.map((e) => e.node);
          setTetherVariant(variants.find((v) => v.availableForSale) ?? null);
        }
        setStock(stockLevel);
      } catch (err) {
        console.error('PurchaseProvider: failed to load products', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tier = getTier(selectedId);
  const rampSize = getRampSize(rampSizeId);

  /** The exact available Shopify variant that fulfils the selected size. */
  const rampVariant = useMemo<Variant | null>(() => {
    if (rampVariants.length === 0) return null;
    const matcher = RAMP_VARIANT_MATCHERS[rampSize.id] ?? RAMP_VARIANT_MATCHERS.standard;
    return rampVariants.find((v) => matcher.test(v.title) && v.availableForSale) ?? null;
  }, [rampVariants, rampSize.id]);

  /** Ramp line price for the selected bundle + size. */
  const rampUnits = tier.id === 'three' ? 2 : 1;
  const rampPrice = money(tier.price + rampSize.priceDelta * rampUnits);

  /**
   * Whether an exact available variant for the selected size has loaded.
   */
  const sizeFulfillable = useMemo(() => {
    if (rampVariants.length === 0) return false;
    const matcher = RAMP_VARIANT_MATCHERS[rampSize.id] ?? RAMP_VARIANT_MATCHERS.standard;
    return rampVariants.some((v) => matcher.test(v.title) && v.availableForSale);
  }, [rampVariants, rampSize.id]);

  /**
   * The mat is included in the price for tiers that bundle it. The order bump
   * therefore only adds it when the tier does not already contain it, so it
   * can never be charged for twice.
   */
  const matAlreadyIncluded = tier.includesMat;
  const bumpActive = bumpEnabled && !matAlreadyIncluded && Boolean(matVariant);

  /** Tether is bundled in the top tier, otherwise offered as an upgrade. */
  const tetherAlreadyIncluded = tier.includesTether === true;
  const tetherActive = tetherUpsell && !tetherAlreadyIncluded && Boolean(tetherVariant);

  const total = money(
    rampPrice + (bumpActive ? BUMP_PRICE : 0) + (tetherActive ? ADDON_PRICES.carTether : 0)
  );

  const savingsPercent = Math.round((1 - tier.price / tier.compareAt) * 100);

  const buy = useCallback(async () => {
    const chosen = rampVariant;
    const bundleDiscount = getBundleDiscount(tier.id);

    if (loading || cartLoading) {
      setError('Checkout is still loading. Please try again in a moment.');
      return;
    }
    if (!sizeFulfillable) {
      setError(
        `The ${rampSize.name} (${rampSize.lengthIn}″) is unavailable — choose another available size or try again later.`
      );
      return;
    }
    if (!chosen) {
      setError('Checkout is temporarily unavailable. Please try again in a moment.');
      return;
    }
    if (tier.includesMat && !matVariant) {
      setError('The traction mat in this package is unavailable. Please try again later.');
      return;
    }
    if (tier.includesTether && !tetherVariant) {
      setError('The safety tether in this package is unavailable. Please try again later.');
      return;
    }

    setBuying(true);
    setError(null);

    const cartLines = [{ merchandiseId: chosen.id, quantity: rampUnits }];
    if ((tier.includesMat || bumpActive) && matVariant) {
      cartLines.push({ merchandiseId: matVariant.id, quantity: 1 });
    }
    if ((tier.includesTether || tetherActive) && tetherVariant) {
      cartLines.push({ merchandiseId: tetherVariant.id, quantity: 1 });
    }

    try {
      const checkoutCart = await startCheckout(
        cartLines,
        bundleDiscount ? [bundleDiscount.code] : []
      );
      const currency = checkoutCart.cost.subtotalAmount.currencyCode;
      const actualMerchandiseTotal = checkoutCart.lines.edges.reduce(
        (sum, { node }) => sum + Number(node.cost.totalAmount.amount),
        0
      );

      // Bundle code did not apply (misconfigured/expired discount, minimum not
      // met, etc.). Do NOT hard-fail the sale over it: the merchandise total is
      // verified to equal the advertised offer price just below, so the shopper
      // still gets the package at its real price. A missing code only affects
      // the owner's margin and is reconciled in Shopify Admin
      // (see LAUNCH_BLOCKERS.md) — it must never block a paying customer.
      if (
        bundleDiscount &&
        !checkoutCart.discountCodes?.some(
          (discount) =>
            discount.code.toLowerCase() === bundleDiscount.code.toLowerCase() &&
            discount.applicable
        )
      ) {
        console.warn(
          `[PawGrip] Bundle discount ${bundleDiscount.code} did not apply; opening checkout at the offer price $${total.toFixed(2)}.`
        );
      }

      if (currency !== 'USD' || Math.abs(actualMerchandiseTotal - total) >= 0.01) {
        setError(
          `Shopify calculated $${actualMerchandiseTotal.toFixed(2)} for this cart, but the selected offer is $${total.toFixed(2)}. Checkout was not opened and no charge was made.`
        );
        return;
      }
      if (!checkoutCart.checkoutUrl) {
        setError('Shopify did not return a checkout link. Please try again in a moment.');
        return;
      }

      const items = checkoutCart.lines.edges.map(({ node }) => ({
        item_id: node.merchandise.id,
        item_name: `${node.merchandise.product.title} - ${node.merchandise.title}`,
        price: Number(node.cost.totalAmount.amount) / node.quantity,
        quantity: node.quantity,
      }));

      for (const { node } of checkoutCart.lines.edges) {
        trackAddToCart(
          node.merchandise.product.handle,
          `${node.merchandise.product.title} - ${node.merchandise.title}`,
          Number(node.cost.totalAmount.amount) / node.quantity,
          node.quantity,
          currency
        );
      }
      trackBeginCheckout(items, currency);
      pushBeginCheckoutDataLayer(items, currency);

      window.location.assign(
        appendAttribution(checkoutCart.checkoutUrl, collectAttributionParams())
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBuying(false);
    }
  }, [tier, rampSize, rampVariant, rampUnits, bumpActive, tetherActive, matVariant, tetherVariant, sizeFulfillable, loading, cartLoading, startCheckout, total]);

  const value: PurchaseContextValue = {
    tier,
    selectedId,
    selectTier: setSelectedId,
    rampSize,
    setRampSize: setRampSizeId,
    rampPrice,
    rampVariant,
    bumpEnabled,
    setBumpEnabled,
    bumpPrice: BUMP_PRICE,
    /** True when the mat is already in the selected bundle. */
    bumpIncluded: matAlreadyIncluded,
    /** Whether the bump should render at all. */
    showBump: !matAlreadyIncluded && Boolean(matVariant),
    tetherUpsell,
    setTetherUpsell,
    tetherPrice: ADDON_PRICES.carTether,
    showTetherUpsell: !tetherAlreadyIncluded && Boolean(tetherVariant),
    total,
    savingsPercent,
    loading: loading || cartLoading,
    ready: !loading,
    rampVariants,
    matVariant,
    tetherVariant,
    stock,
    buying,
    error,
    buy,
  };

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}
