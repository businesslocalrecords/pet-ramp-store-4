import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CATALOG, type CatalogKind, type CatalogUse } from '../lib/catalog';
import { ProductCard } from '../components/ProductCard';
import { usePageMeta } from '../lib/use-page-meta';

const PLACES: { id: CatalogUse; label: string }[] = [
  { id: 'car', label: 'Car, SUV or truck' },
  { id: 'home', label: 'Bed or couch' },
  { id: 'cargo', label: 'Door or hitch' },
];

const KINDS: { id: CatalogKind; label: string }[] = [
  { id: 'ramp', label: 'Ramps' },
  { id: 'stairs', label: 'Stairs and steps' },
  { id: 'accessory', label: 'Accessories' },
];

type SortId = 'relevance' | 'price-asc' | 'price-desc' | 'rating';

function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  return raw ? raw.split(',').filter(Boolean) : [];
}

export const CategoryPage: React.FC = () => {
  usePageMeta('/dog-ramps');
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const places = readList(params, 'place') as CatalogUse[];
  const kinds = readList(params, 'type') as CatalogKind[];
  const prices = readList(params, 'price');
  const [sort, setSort] = useState<SortId>('relevance');
  const [filtersOpen, setFiltersOpen] = useState(false);

  function toggle(key: string, value: string) {
    const next = new URLSearchParams(params);
    const current = readList(next, key);
    const updated = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    if (updated.length) next.set(key, updated.join(','));
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const results = useMemo(() => {
    let items = CATALOG.filter((product) => {
      if (places.length && !places.includes(product.use)) return false;
      if (kinds.length && !kinds.includes(product.kind)) return false;
      if (prices.length) {
        const under = product.price < 100;
        const matches = (prices.includes('under100') && under) || (prices.includes('over100') && !under);
        if (!matches) return false;
      }
      if (!q) return true;
      return `${product.name} ${product.caption} ${product.summary}`.toLowerCase().includes(q);
    });
    if (sort === 'price-asc') items = [...items].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') items = [...items].sort((a, b) => b.price - a.price);
    if (sort === 'rating') items = [...items].sort((a, b) => b.rating - a.rating);
    return items;
  }, [places, kinds, prices, sort, q]);

  const heading = kinds.length === 1 && kinds[0] === 'stairs'
    ? 'Dog stairs and steps'
    : kinds.length === 1 && kinds[0] === 'ramp'
      ? 'Dog ramps'
      : 'Dog ramps, stairs and steps';

  const chips = [
    ...places.map((id) => ({ key: 'place', value: id, label: PLACES.find((item) => item.id === id)?.label ?? id })),
    ...kinds.map((id) => ({ key: 'type', value: id, label: KINDS.find((item) => item.id === id)?.label ?? id })),
    ...prices.map((id) => ({ key: 'price', value: id, label: id === 'under100' ? 'Under $100' : '$100 and up' })),
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-pine">Home</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">Dog ramps</span>
      </nav>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{heading}</h1>
          <p className="mt-1 text-sm font-semibold text-pine">{results.length} products</p>
          {q ? (
            <p className="mt-2 text-muted">Results for “{params.get('q')}”</p>
          ) : (
            <p className="mt-2 max-w-xl text-muted">
              Pick where your dog needs help. Then pick a product.
            </p>
          )}
        </div>
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="shop-filters"
          className="h-10 rounded-full border border-line bg-white px-4 text-sm font-semibold lg:hidden"
        >
          Filter{chips.length ? ` (${chips.length})` : ''}
        </button>
        <label className="text-sm font-semibold">
          <span className="mr-2 text-muted">Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortId)}
            className="h-10 rounded-full border border-line bg-white px-3"
          >
            <option value="relevance">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Highest rated</option>
          </select>
        </label>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() => toggle(chip.key, chip.value)}
              className="h-8 rounded-full bg-pine px-3 text-sm font-semibold text-white"
            >
              {chip.label} <span aria-hidden="true">×</span>
              <span className="sr-only">Remove {chip.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside
          id="shop-filters"
          className={`h-fit space-y-6 rounded-2xl border border-line bg-white p-4 lg:block ${filtersOpen ? 'block' : 'hidden'}`}
          aria-label="Filters"
        >
          <CheckGroup label="Where it goes" options={PLACES} selected={places} onToggle={(id) => toggle('place', id)} />
          <CheckGroup label="Type" options={KINDS} selected={kinds} onToggle={(id) => toggle('type', id)} />
          <CheckGroup
            label="Price"
            options={[{ id: 'under100', label: 'Under $100' }, { id: 'over100', label: '$100 and up' }]}
            selected={prices}
            onToggle={(id) => toggle('price', id)}
          />
        </aside>

        {results.length === 0 ? (
          <p className="rounded-2xl bg-well p-8 text-muted">
            Nothing matches those filters. Clear one and try again.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

function CheckGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { id: T; label: string }[];
  selected: string[];
  onToggle: (id: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-bold">{label}</legend>
      <div className="mt-2 space-y-2">
        {options.map((option) => (
          <label key={option.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={() => onToggle(option.id)}
              className="h-4 w-4 accent-pine"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
