import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CATALOG, type CatalogKind, type CatalogUse } from '../lib/catalog';
import { ProductCard } from '../components/ProductCard';

const PLACES: { id: CatalogUse; label: string }[] = [
  { id: 'car', label: 'Car' },
  { id: 'home', label: 'Bed and couch' },
  { id: 'cargo', label: 'Door and hitch' },
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
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const places = readList(params, 'place') as CatalogUse[];
  const kinds = readList(params, 'type') as CatalogKind[];
  const prices = readList(params, 'price');
  const [sort, setSort] = useState<SortId>('relevance');

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
      <nav className="text-sm text-[#5C6B73]" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-[#0F6E62]">Home</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-[#14202B]">Dog ramps</span>
      </nav>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{heading}</h1>
          {q ? (
            <p className="mt-2 text-[#5C6B73]">Results for “{params.get('q')}”</p>
          ) : (
            <p className="mt-2 max-w-xl text-[#5C6B73]">
              Cargo area, back seat, bed, or couch. Filter to the place the dog is stuck, then open the one that fits.
            </p>
          )}
        </div>
        <label className="text-sm font-semibold">
          <span className="mr-2 text-[#5C6B73]">Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortId)}
            className="h-10 rounded-full border border-[#E4EAEB] bg-white px-3"
          >
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Avg. Customer Review</option>
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() => toggle(chip.key, chip.value)}
              className="h-8 rounded-full bg-[#F3F6F7] px-3 text-sm font-semibold"
            >
              {chip.label} <span aria-hidden="true">×</span>
              <span className="sr-only">Remove {chip.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6" aria-label="Filters">
          <CheckGroup label="Placement" options={PLACES} selected={places} onToggle={(id) => toggle('place', id)} />
          <CheckGroup label="Product type" options={KINDS} selected={kinds} onToggle={(id) => toggle('type', id)} />
          <CheckGroup
            label="Price"
            options={[{ id: 'under100', label: 'Under $100' }, { id: 'over100', label: '$100 and up' }]}
            selected={prices}
            onToggle={(id) => toggle('price', id)}
          />
        </aside>

        {results.length === 0 ? (
          <p className="rounded-2xl bg-[#F3F6F7] p-8 text-[#5C6B73]">
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
              className="h-4 w-4 accent-[#0F6E62]"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
