import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CATALOG, type CatalogUse } from '../lib/catalog';
import { ProductCard } from '../components/ProductCard';

const USES: { id: CatalogUse | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'car', label: 'Into the car' },
  { id: 'home', label: 'At home' },
  { id: 'cargo', label: 'Cargo and hitch' },
];

export const CategoryPage: React.FC = () => {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const [use, setUse] = useState<CatalogUse | 'all'>('all');
  const [capacity, setCapacity] = useState<'all' | '150' | '120'>('all');
  const [priceBand, setPriceBand] = useState<'all' | 'under100' | 'over100'>('all');
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const results = useMemo(() => {
    let items = CATALOG.filter((product) => {
      if (use !== 'all' && product.use !== use) return false;
      if (capacity === '150' && product.capacityLb < 150) return false;
      if (capacity === '120' && product.capacityLb > 120) return false;
      if (priceBand === 'under100' && product.price >= 100) return false;
      if (priceBand === 'over100' && product.price < 100) return false;
      if (!q) return true;
      const hay = `${product.name} ${product.caption} ${product.summary}`.toLowerCase();
      return hay.includes(q);
    });
    if (sort === 'price-asc') items = [...items].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [use, capacity, priceBand, sort, q]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <nav className="text-sm text-[#5C6B73]" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-[#0F6E62]">Home</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-[#14202B]">Dog ramps</span>
      </nav>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Dog ramps and stairs</h1>
          <p className="mt-2 text-[#5C6B73]">
            {results.length} {results.length === 1 ? 'product' : 'products'}
            {q ? ` for “${params.get('q')}”` : ''}
          </p>
        </div>
        <label className="text-sm font-semibold">
          <span className="mr-2 text-[#5C6B73]">Sort</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            className="h-10 rounded-full border border-[#E4EAEB] bg-white px-3"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </label>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6" aria-label="Filters">
          <FilterGroup label="Use">
            {USES.map((item) => (
              <Pill key={item.id} active={use === item.id} onClick={() => setUse(item.id)}>
                {item.label}
              </Pill>
            ))}
          </FilterGroup>
          <FilterGroup label="Capacity">
            <Pill active={capacity === 'all'} onClick={() => setCapacity('all')}>Any</Pill>
            <Pill active={capacity === '120'} onClick={() => setCapacity('120')}>Up to 120 lb</Pill>
            <Pill active={capacity === '150'} onClick={() => setCapacity('150')}>150 lb and up</Pill>
          </FilterGroup>
          <FilterGroup label="Price">
            <Pill active={priceBand === 'all'} onClick={() => setPriceBand('all')}>Any</Pill>
            <Pill active={priceBand === 'under100'} onClick={() => setPriceBand('under100')}>Under $100</Pill>
            <Pill active={priceBand === 'over100'} onClick={() => setPriceBand('over100')}>$100 and up</Pill>
          </FilterGroup>
        </aside>

        {results.length === 0 ? (
          <p className="rounded-2xl bg-[#F3F6F7] p-8 text-[#5C6B73]">
            Nothing matches those filters. Clear one and try again.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {results.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

const FilterGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <h2 className="text-sm font-bold">{label}</h2>
    <div className="mt-2 flex flex-wrap gap-2">{children}</div>
  </div>
);

const Pill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`h-9 rounded-full px-3 text-sm font-semibold ${
      active ? 'bg-[#14202B] text-white' : 'bg-[#F3F6F7] text-[#14202B] hover:bg-[#E4EAEB]'
    }`}
  >
    {children}
  </button>
);
