import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatPrice, isOwnProduct, productPath, type CatalogProduct } from '../lib/catalog';
import { Stars } from './Stars';

export const ProductCard: React.FC<{ product: CatalogProduct }> = ({ product }) => {
  const { search } = useLocation();
  const [hover, setHover] = useState(false);
  const src = hover && product.imageHover ? product.imageHover : product.image;
  const to = { pathname: productPath(product), search };

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="aspect-square bg-well">
        <img src={src} alt={product.imageAlt} className="h-full w-full object-contain" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {isOwnProduct(product) && <p className="text-xs font-semibold text-pine">{product.caption}</p>}
        <h3 className="line-clamp-3 text-sm font-bold leading-snug sm:text-base">
          <Link
            to={to}
            className="text-ink after:absolute after:inset-0 group-hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            {product.name}
          </Link>
        </h3>
        <Stars value={product.rating} count={product.ratingCount} />
        <p className="mt-auto pt-1 text-lg font-extrabold tabular-nums text-ink">{formatPrice(product.price)}</p>
      </div>
    </article>
  );
};
