/**
 * Analytics tracking utilities for CPC campaigns.
 * Supports Google Ads (gtag), Meta Pixel (fbq), and GA4.
 */

interface AnalyticsEventParams {
  event_name: string;
  currency?: string;
  value?: number;
  items?: Array<{
    item_id: string;
    item_name?: string;
    quantity: number;
    price: number;
    item_category?: string;
  }>;
  content_ids?: string[];
  content_type?: 'product' | 'product_group';
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
    dataLayer: unknown[];
    uetq?: unknown[] | { push: (...args: unknown[]) => void };
    UET?: new (config: { ti: string; q?: unknown; ts?: number; enableAutoSpaTracking?: boolean }) => {
      push: (...args: unknown[]) => void;
    };
  }
}

/**
 * Initialize analytics with Google Ads conversion ID and Meta Pixel ID.
 * Call this once in your app root (e.g., main.tsx).
 */
export function initAnalytics(config: {
  gaMeasurementId?: string;      // G-XXXXXXXXXX
  googleAdsConversionId?: string; // AW-XXXXXXXXX
  metaPixelId?: string;           // 123456789012345
  microsoftUetTagId?: string;     // 343278405 — Microsoft Advertising (Bing) UET
}) {
  if (typeof window === 'undefined') return;

  const { gaMeasurementId, googleAdsConversionId, metaPixelId, microsoftUetTagId } = config;

  // Google Analytics 4 + Google Ads (via gtag)
  if (gaMeasurementId || googleAdsConversionId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());

    if (gaMeasurementId) {
      window.gtag('config', gaMeasurementId);
    }
    if (googleAdsConversionId) {
      window.gtag('config', googleAdsConversionId);
    }

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId || googleAdsConversionId}`;
    document.head.appendChild(script);
  }

  // Meta Pixel
  if (metaPixelId) {
    const fbq = function (...args: unknown[]) {
      const fn = fbq as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[] };
      if (fn.callMethod) {
        fn.callMethod(...args);
      } else {
        fn.queue.push(args);
      }
    };
    (fbq as unknown as { queue: unknown[] }).queue = [];
    (window as { fbq: unknown }).fbq = fbq;
    fbq('init', metaPixelId);
    fbq('track', 'PageView');

    // Load Meta Pixel script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  // Microsoft UET (the bat.js tag Microsoft Advertising/Bing provides).
  // Faithful port of the official snippet, so it behaves exactly like the
  // one pasted into the root domain: queue first, swap in the UET instance
  // once bat.js loads, push pageLoad. Auto-SPA tracking stays on because
  // this app has no router.
  if (microsoftUetTagId) {
    window.uetq = window.uetq || [];
    const uetConfig = {
      ti: microsoftUetTagId,
      q: window.uetq,
      ts: Date.now(),
      enableAutoSpaTracking: true,
    };
    // the legacy readyState pair is not on TS's HTMLScriptElement
    const uetScript = document.createElement('script') as HTMLScriptElement & {
      onreadystatechange?: (() => void) | null;
      readyState?: string;
    };
    uetScript.async = true;
    uetScript.src = `https://bat.bing.net/bat.js?ti=${encodeURIComponent(microsoftUetTagId)}`;
    const swapInUet = () => {
      const UET = window.UET;
      if (UET) {
        const instance = new UET(uetConfig);
        window.uetq = instance;
        instance.push('pageLoad');
      }
      uetScript.onload = null;
      uetScript.onreadystatechange = null;
    };
    uetScript.onload = swapInUet;
    uetScript.onreadystatechange = () => {
      const readyState = uetScript.readyState;
      if (readyState && readyState !== 'loaded' && readyState !== 'complete') return;
      swapInUet();
    };
    document.head.appendChild(uetScript);
  }
}

/**
 * Track a custom event across all configured platforms.
 */
export function trackEvent(params: AnalyticsEventParams) {
  if (typeof window === 'undefined') return;

  const { event_name, currency = 'USD', value, items, content_ids, content_type } = params;

  // GA4 / Google Ads via gtag
  if (window.gtag) {
    window.gtag('event', event_name, {
      currency,
      value,
      items,
      content_ids,
      content_type,
    });
  }

  // Meta Pixel
  if (window.fbq) {
    const fbqEventMap: Record<string, string> = {
      view_item: 'ViewContent',
      add_to_cart: 'AddToCart',
      begin_checkout: 'InitiateCheckout',
      purchase: 'Purchase',
      view_cart: 'ViewCart',
    };
    const fbqEvent = fbqEventMap[event_name] || event_name;
    window.fbq('track', fbqEvent, {
      currency,
      value,
      content_ids,
      content_type,
      contents: items?.map(item => ({
        id: item.item_id,
        quantity: item.quantity,
        item_price: item.price,
      })),
    });
  }

  // Console log for debugging
  console.debug('[Analytics]', event_name, params);
}

/**
 * Track product view (landing page load)
 */
export function trackViewItem(itemId: string, itemName: string, price: number, currency = 'USD') {
  trackEvent({
    event_name: 'view_item',
    currency,
    value: price,
    items: [{ item_id: itemId, item_name: itemName, quantity: 1, price }],
    content_ids: [itemId],
    content_type: 'product',
  });
}

/**
 * Track add to cart
 */
export function trackAddToCart(itemId: string, itemName: string, price: number, quantity: number, currency = 'USD') {
  trackEvent({
    event_name: 'add_to_cart',
    currency,
    value: price * quantity,
    items: [{ item_id: itemId, item_name: itemName, quantity, price }],
    content_ids: [itemId],
    content_type: 'product',
  });
}

/**
 * Track begin checkout
 */
export function trackBeginCheckout(items: Array<{ item_id: string; item_name: string; price: number; quantity: number }>, currency = 'USD') {
  const value = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  trackEvent({
    event_name: 'begin_checkout',
    currency,
    value,
    items,
    content_ids: items.map(i => i.item_id),
    content_type: 'product',
  });
}

/* ==========================================================================
   Custom events (V3) — funnel signals beyond the standard e-commerce set
   ========================================================================== */

/** Visitor used the size finder. `size` is 'standard' | 'extended'. */
export function trackSizeFinderUsed(params: {
  size: string;
  vehicleHeightIn: number;
  slopeDeg: number;
}) {
  trackEvent({
    event_name: 'size_finder_used',
    value: params.vehicleHeightIn,
    items: [
      {
        item_id: `size_finder:${params.size}`,
        item_name: `Size finder — ${params.size}`,
        quantity: 1,
        price: params.slopeDeg,
      },
    ],
  });
}

/** Visitor expanded an FAQ entry. `question` is the question text. */
export function trackFaqOpen(question: string) {
  trackEvent({
    event_name: 'faq_open',
    items: [
      {
        item_id: 'faq',
        item_name: question.slice(0, 120),
        quantity: 1,
        price: 0,
      },
    ],
  });
}

/** Contact or lead form submitted. `form` is the Netlify form name. */
export function trackLeadSubmit(form: string) {
  trackEvent({
    event_name: 'lead_submit',
    items: [
      {
        item_id: form,
        item_name: `Lead — ${form}`,
        quantity: 1,
        price: 0,
      },
    ],
  });
}

/** Founding-tester application submitted. */
export function trackTesterApply() {
  trackEvent({
    event_name: 'tester_apply',
    items: [
      {
        item_id: 'founding-tester',
        item_name: 'Founding tester application',
        quantity: 1,
        price: 0,
      },
    ],
  });
}

/* ==========================================================================
   Purchase tracking — DELIBERATELY NOT IMPLEMENTED HERE
   ==========================================================================
   The old trackPurchase() / pushPurchaseCompleteDataLayer() functions could
   never execute: with headless checkout the thank-you page lives on Shopify's
   checkout domain (shop.com/checkouts/...), not on this app, so this code
   never loads after payment.

   Purchase conversion tracking therefore belongs in the Shopify Customer
   Events custom pixel:
     Shopify Admin -> Settings -> Customer events -> Add custom pixel
   Subscribe to `checkout_completed` there and push the `purchase` event to
   dataLayer / gtag / fbq from inside the pixel. Tracked as a launch blocker
   in LAUNCH_BLOCKERS.md because it is Shopify admin work, not app code.

   The `purchase` entry stays in the fbq event map below so the shared
   trackEvent helper remains forward-compatible with the pixel's events.
 */

/* ==========================================================================
   Enhanced Conversions
   ========================================================================== */

export interface DataLayerItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

/**
 * GA4 / Google Ads compliant dataLayer.push for begin_checkout.
 *
 * `currency` + `value` + `items` make the event measurable in GA4 reports and
 * usable as a Google Ads conversion action for target-ROAS bidding.
 */
export function pushBeginCheckoutDataLayer(
  items: DataLayerItem[],
  currency = 'USD'
): void {
  if (typeof window === 'undefined') return;

  const value = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  window.dataLayer.push({
    event: 'begin_checkout',
    ecommerce: {
      currency,
      value: Number(value.toFixed(2)),
      items: items.map((item) => ({
        item_id: item.item_id,
        item_name: item.item_name,
        price: item.price,
        quantity: item.quantity,
        item_category: 'Pet Ramp',
      })),
    },
  });

  console.debug('[Analytics] dataLayer begin_checkout pushed', { value, itemCount: items.length });
}