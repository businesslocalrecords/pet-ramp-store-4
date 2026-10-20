import React from 'react';
import type { CatalogProduct } from '../lib/catalog';
import { ProductCard } from './ProductCard';

/** Related-product cards. Always rendered immediately before shipping and warranty. */
export const MoreRamps: React.FC<{
  products: readonly CatalogProduct[];
  className?: string;
  gridClassName?: string;
}> = ({ products, className = 'mt-10', gridClassName = 'grid-cols-2 lg:grid-cols-3' }) => {
  if (products.length === 0) return null;

  return (
    <section className={className} aria-labelledby="more-ramps">
      <h2 id="more-ramps" className="text-2xl font-extrabold tracking-tight">More ramps and steps</h2>
      <div className={`mt-6 grid gap-4 ${gridClassName}`}>
        {products.map((item) => (
          <ProductCard key={item.slug} product={item} />
        ))}
      </div>
    </section>
  );
};
