import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatPrice, productPath, type CatalogProduct } from '../lib/catalog';
import { Stars } from './Stars';

export const ProductCard: React.FC<{ product: CatalogProduct }> = ({ product }) => {
  const { search } = useLocation();
  const [hover, setHover] = useState(false);
  const src = hover && product.imageHover ? product.imageHover : product.image;
  const to = { pathname: productPath(product), search };

  return (
    <article
      className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link to={to} className="relative block aspect-square bg-well">
        <img src={src} alt={product.imageAlt} className="h-full w-full object-contain" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-pine">{product.caption}</p>
        <h3 className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">
          <Link to={to} className="text-ink hover:text-pine">{product.name}</Link>
        </h3>
        <Stars value={product.rating} count={product.ratingCount} />
        <p className="pt-1 text-lg font-extrabold tabular-nums text-ink">{formatPrice(product.price)}</p>
        <p className="text-[11px] font-medium text-deal">Free shipping</p>
        <Link
          to={to}
          className="mt-auto inline-flex h-11 items-center justify-center rounded-full bg-cta text-sm font-bold text-white hover:bg-cta-deep"
        >
          Shop this
        </Link>
      </div>
    </article>
  );
};
