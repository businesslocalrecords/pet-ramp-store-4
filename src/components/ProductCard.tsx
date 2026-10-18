import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatPrice, productPath, type CatalogProduct } from '../lib/catalog';
import { FREE_SHIPPING_LABEL } from '../lib/policy';
import { Stars } from './Stars';

export const ProductCard: React.FC<{ product: CatalogProduct }> = ({ product }) => {
  const { search } = useLocation();
  const [hover, setHover] = useState(false);
  const src = hover && product.imageHover ? product.imageHover : product.image;
  const to = { pathname: productPath(product), search };

  return (
    <article
      className="flex flex-col overflow-hidden rounded-2xl border border-[#E4EAEB] bg-white"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link to={to} className="relative block aspect-square bg-[#F3F6F7]">
        <img src={src} alt={product.imageAlt} className="h-full w-full object-contain" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0F6E62]">Paw Grip</p>
        <h3 className="text-base font-bold leading-snug">
          <Link to={to} className="text-[#14202B] hover:text-[#0F6E62]">{product.name}</Link>
        </h3>
        <p className="text-sm text-[#5C6B73]">{product.caption}</p>
        <Stars value={product.rating} count={product.ratingCount} />
        <p className="pt-1 text-lg font-extrabold tabular-nums text-[#14202B]">{formatPrice(product.price)}</p>
        <p className="text-xs font-medium text-[#0F6E62]">{FREE_SHIPPING_LABEL}</p>
        <Link
          to={{ ...to, hash: 'offer' }}
          className="mt-auto inline-flex h-11 items-center justify-center rounded-full border border-[#F37021] text-sm font-bold text-[#F37021] hover:bg-[#F37021] hover:text-white"
        >
          Add to Cart
        </Link>
      </div>
    </article>
  );
};
