import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatPrice, productPath, type CatalogProduct } from '../lib/catalog';
import { FREE_SHIPPING_LABEL } from '../lib/policy';
import { Stars } from './Stars';

export const ProductCard: React.FC<{ product: CatalogProduct }> = ({ product }) => {
  const { search } = useLocation();
  const [hover, setHover] = useState(false);
  const src = hover && product.imageHover ? product.imageHover : product.image;

  return (
    <Link
      to={{ pathname: productPath(product), search }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E4EAEB] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="relative aspect-square bg-[#F3F6F7]">
        <img
          src={src}
          alt={product.imageAlt}
          className="h-full w-full object-contain transition-opacity duration-200 motion-reduce:transition-none"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0F6E62]">Paw-Grip</p>
        <h3 className="text-base font-bold leading-snug text-[#14202B]">{product.name}</h3>
        <p className="text-sm text-[#5C6B73]">{product.caption}</p>
        <Stars value={product.rating} count={product.ratingCount} />
        <p className="mt-auto pt-2 text-lg font-extrabold tabular-nums text-[#14202B]">
          {formatPrice(product.price)}
        </p>
        <p className="text-xs font-medium text-[#0F6E62]">{FREE_SHIPPING_LABEL}</p>
      </div>
    </Link>
  );
};
