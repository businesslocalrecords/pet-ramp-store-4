import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findBySlug, formatPrice, CATALOG } from '../lib/catalog';
import { Stars } from '../components/Stars';
import { FREE_SHIPPING_LABEL, GUARANTEE_LABEL } from '../lib/policy';
import { fetchProductByHandle } from '../lib/shopify';
import { useCart } from '../lib/cart-context';
import { appendAttribution, collectAttributionParams } from '../lib/dki';
import { ProductCard } from '../components/ProductCard';
import { ProductPhotoGallery } from '../components/ProductPhotoGallery';
import { CatalogLanding } from '../components/CatalogLanding';
import { MAX_QUANTITY } from '../lib/purchase-provider';

export const CatalogProductPage: React.FC = () => {
  const { handle = '' } = useParams();
  const product = findBySlug(handle);
  const { startCheckout } = useCart();
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [barVisible, setBarVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const buyButtonRef = useRef<HTMLButtonElement>(null);
  const [stock, setStock] = useState<number | null>(null);
  const stockHandle = product && !product.flagship ? product.shopifyHandle : '';
  const [quantityHandle, setQuantityHandle] = useState(stockHandle);

  if (quantityHandle !== stockHandle) {
    setQuantityHandle(stockHandle);
    setQuantity(1);
    setStock(null);
    setError(null);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 280);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const button = buyButtonRef.current;
    if (!button) return;
    const observer = new IntersectionObserver(
      ([entry]) => setBarVisible(!entry.isIntersecting),
      { threshold: 0.4 },
    );
    observer.observe(button);
    return () => observer.disconnect();
  }, [product?.slug]);

  useEffect(() => {
    if (!stockHandle) return;
    let cancelled = false;
    fetchProductByHandle(stockHandle)
      .then((live) => {
        if (cancelled) return;
        const variant = live?.variants.edges.map((edge) => edge.node).find((node) => node.availableForSale);
        if (!variant) {
          setStock(0);
          return;
        }
        setStock(typeof variant.quantityAvailable === 'number' ? variant.quantityAvailable : null);
      })
      .catch(() => {
        if (!cancelled) setStock(null);
      });
    return () => {
      cancelled = true;
    };
  }, [stockHandle]);

  const maxQuantity = Math.max(1, Math.min(MAX_QUANTITY, stock ?? MAX_QUANTITY));
  const safeQuantity = Math.min(quantity, maxQuantity);

  if (!product || product.flagship) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-extrabold">That product is not in the shop.</h1>
        <Link to="/dog-ramps" className="mt-4 inline-block font-bold text-pine">
          Back to dog ramps
        </Link>
      </main>
    );
  }

  async function buy() {
    if (!product) return;
    setBuying(true);
    setError(null);
    try {
      const live = await fetchProductByHandle(product.shopifyHandle);
      const variant = live?.variants.edges.map((edge) => edge.node).find((node) => node.availableForSale);
      if (!variant) {
        setError('This test product is not in the live Shopify catalog yet. Its handle is ready for the seeder.');
        return;
      }
      const units = Math.min(safeQuantity, Math.max(1, Math.min(MAX_QUANTITY, variant.quantityAvailable ?? MAX_QUANTITY)));
      const cart = await startCheckout([{ merchandiseId: variant.id, quantity: units }]);
      window.location.assign(appendAttribution(cart.checkoutUrl, collectAttributionParams()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout could not start.');
    } finally {
      setBuying(false);
    }
  }

  const also = CATALOG.filter((item) => item.slug !== product.slug).slice(0, 3);

  return (
    <main className={`mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12 ${barVisible && scrolled ? 'pb-28 md:pb-12' : ''}`}>
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-pine">Home</Link>
        <span aria-hidden="true"> / </span>
        <Link to="/dog-ramps" className="hover:text-pine">Dog ramps</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-2">
        <div className="min-w-0">
          {product.photos.length > 0 ? (
            <ProductPhotoGallery photos={product.photos} />
          ) : (
            <figure>
              <div className="overflow-hidden rounded-2xl bg-well">
                <img src={product.image} alt={product.imageAlt} className="aspect-square w-full object-contain" />
              </div>
              <figcaption className="mt-3 text-sm font-semibold text-muted">{product.caption}</figcaption>
            </figure>
          )}
        </div>

        <div id="offer" className="rounded-2xl border border-line bg-white p-5 shadow-sm lg:sticky lg:top-28 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-pine">{product.caption}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-3">
            <Stars value={product.rating} count={product.ratingCount} />
          </div>
          <p className="mt-4 text-3xl font-extrabold tabular-nums">{formatPrice(product.price)}</p>
          <p className="mt-2 text-sm text-muted">
            {FREE_SHIPPING_LABEL}. {GUARANTEE_LABEL}.
          </p>
          <p className="mt-4 text-muted">{product.summary}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {product.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span aria-hidden="true" className="text-pine">•</span>
                {bullet}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-3">
            <label htmlFor="product-quantity" className="text-xs font-bold uppercase tracking-wide text-muted">
              Quantity
            </label>
            <select
              id="product-quantity"
              value={safeQuantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="min-h-11 rounded-md border border-line bg-white px-3 text-sm font-bold text-ink"
            >
              {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button
            ref={buyButtonRef}
            type="button"
            onClick={buy}
            disabled={buying}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-cta text-base font-bold text-white hover:bg-cta-deep disabled:opacity-60"
          >
            {buying ? 'Starting checkout…' : `Add to cart · ${formatPrice(product.price)}`}
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      {barVisible && scrolled && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(28,36,32,0.08)] md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xl font-extrabold tabular-nums leading-none">{formatPrice(product.price)}</p>
            <p className="mt-1 text-[11px] font-semibold text-deal">{FREE_SHIPPING_LABEL}</p>
          </div>
          <button
            type="button"
            onClick={buy}
            disabled={buying}
            className="ml-auto inline-flex h-12 min-w-36 items-center justify-center rounded-full bg-cta px-5 text-sm font-bold text-white hover:bg-cta-deep disabled:opacity-60"
          >
            {buying ? 'Starting…' : 'Add to cart'}
          </button>
        </div>
      </div>}

      <CatalogLanding product={product} buying={buying} onBuy={buy} />

      <section className="mt-16">
        <h2 className="text-2xl font-extrabold tracking-tight">Often added with this</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {also.map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      </section>
    </main>
  );
};
