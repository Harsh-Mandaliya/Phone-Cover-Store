'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard, ProductSkeleton } from '@/components/store/ProductCard';
import { Empty } from '@/components/store/bits';
import { ProductArt } from '@/components/ProductArt';
import { api } from '@/lib/api';
import { cn, inr } from '@/lib/format';
import type { Category, Product } from '@/lib/types';

const SORTS = [
  ['popular', 'Popularity'],
  ['newest', 'Newest'],
  ['price-asc', 'Price: Low to High'],
  ['price-desc', 'Price: High to Low'],
  ['rating', 'Top rated'],
] as const;

const FLAGS: Record<string, string> = { sale: 'On Sale', trending: 'Trending', featured: 'Featured', new: 'New Arrivals' };

export default function ShopPage() {
  return (
    <Suspense>
      <Shop />
    </Suspense>
  );
}

function Shop() {
  const sp = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [filters, setFilters] = useState<{ models: string[]; maxPrice: number }>({ models: [], maxPrice: 5000 });
  const [panel, setPanel] = useState(false);

  const params = useMemo(() => Object.fromEntries(sp.entries()), [sp]);
  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    router.replace(`/shop?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    api<Category[]>('/categories').then(setCats).catch(() => {});
    api<{ models: string[]; maxPrice: number }>('/filters').then(setFilters).catch(() => {});
  }, []);
  useEffect(() => {
    setProducts(null);
    const t = setTimeout(() => {
      api<{ products: Product[] }>(`/products?${sp.toString()}&limit=100`)
        .then((r) => setProducts(r.products))
        .catch(() => setProducts([]));
    }, 120);
    return () => clearTimeout(t);
  }, [sp]);

  const cat = cats.find((c) => c.slug === params.category);
  const title = params.q ? `Results for “${params.q}”` : params.model ? `For ${params.model}` : cat?.name || (params.flag && FLAGS[params.flag]) || 'All Products';
  const chips = [
    params.category && { k: 'category', l: cat?.name || params.category },
    params.model && { k: 'model', l: params.model },
    params.flag && { k: 'flag', l: FLAGS[params.flag] || params.flag },
    params.q && { k: 'q', l: `“${params.q}”` },
    params.max && { k: 'max', l: `Under ${inr(+params.max)}` },
    params.inStock && { k: 'inStock', l: 'In stock' },
  ].filter(Boolean) as { k: string; l: string }[];

  const filterPanel = (
    <div className="space-y-7">
      <div>
        <p className="label">Category</p>
        <div className="space-y-1">
          <button onClick={() => set({ category: undefined })} className={cn('flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition', !params.category ? 'bg-brand-50 font-semibold text-brand' : 'hover:bg-cream')}>
            All categories
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => set({ category: c.slug })}
              className={cn('flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition', params.category === c.slug ? 'bg-brand-50 font-semibold text-brand' : 'hover:bg-cream')}
            >
              <span className="size-6 shrink-0">
                <ProductArt art={c.art} color={c.color} className="h-full w-full" />
              </span>
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-muted">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[#EFF6FF] p-4">
        <p className="text-center text-xs font-bold tracking-wide uppercase">Find your phone</p>
        <p className="mb-3 text-center text-xs text-muted">Show only items that fit your device</p>
        <select value={params.model || ''} onChange={(e) => set({ model: e.target.value || undefined })} className="input py-2.5">
          <option value="">All devices</option>
          {filters.models.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="label flex justify-between">
          Max price <span className="text-ink normal-case">{inr(+(params.max || filters.maxPrice))}</span>
        </p>
        <input
          type="range"
          min={300}
          max={filters.maxPrice || 5000}
          step={100}
          defaultValue={params.max || filters.maxPrice}
          key={filters.maxPrice}
          onMouseUp={(e) => set({ max: (e.target as HTMLInputElement).value })}
          onTouchEnd={(e) => set({ max: (e.target as HTMLInputElement).value })}
          onKeyUp={(e) => set({ max: (e.target as HTMLInputElement).value })}
          className="w-full accent-brand"
        />
        <div className="flex justify-between text-xs text-muted">
          <span>₹300</span>
          <span>{inr(filters.maxPrice)}</span>
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-xl bg-cream px-3 py-3 text-sm">
        Hide sold-out items
        <input type="checkbox" checked={!!params.inStock} onChange={(e) => set({ inStock: e.target.checked ? '1' : undefined })} className="size-4 accent-brand" />
      </label>
    </div>
  );

  return (
    <div className="container-x py-8 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={title}>
        <p className="text-xs text-muted">Home / Shop{cat ? ` / ${cat.name}` : ''}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">{title}</h1>
        {cat?.tagline && <p className="mt-1 text-sm text-muted">{cat.tagline}</p>}
      </motion.div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl bg-white p-5">
            <p className="mb-5 flex items-center gap-2 font-display font-semibold">
              <SlidersHorizontal className="size-4" /> Filters
            </p>
            {filterPanel}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
            <button onClick={() => setPanel(true)} className="btn-line lg:hidden">
              <SlidersHorizontal className="size-4" /> Filters
            </button>
            <span className="hidden text-xs font-semibold tracking-wide text-muted uppercase sm:inline">Sort by:</span>
            <div className="no-scrollbar flex gap-1 overflow-x-auto">
              {SORTS.map(([k, l]) => {
                const active = (params.sort || 'popular') === k;
                return (
                  <button key={k} onClick={() => set({ sort: k === 'popular' ? undefined : k })} className={cn('relative shrink-0 rounded-full px-3 py-1.5 text-sm transition', active ? 'font-semibold text-brand' : 'text-muted hover:text-ink')}>
                    {active && <motion.span layoutId="sort-u" className="absolute inset-x-3 -bottom-[17px] h-0.5 rounded-full bg-brand" />}
                    {l}
                  </button>
                );
              })}
            </div>
            <span className="ml-auto text-sm text-muted">{products ? `${products.length} items` : '…'}</span>
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button key={c.k} onClick={() => set({ [c.k]: undefined })} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs text-white">
                  {c.l} <X className="size-3" />
                </button>
              ))}
              <button onClick={() => router.replace('/shop')} className="text-xs font-medium text-brand underline-offset-2 hover:underline">
                Clear all
              </button>
            </div>
          )}

          <div className="mt-6">
            {products === null ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <Empty
                icon={<PackageSearch className="size-7" />}
                title="Nothing matches yet"
                text="Try removing a filter or searching for something else."
                action={
                  <button className="btn-brand" onClick={() => router.replace('/shop')}>
                    Show all products
                  </button>
                }
              />
            ) : (
              <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {products.map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {panel && (
          <motion.div className="fixed inset-0 z-[80] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40" onClick={() => setPanel(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }} className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-lg font-semibold">Filters</p>
                <button onClick={() => setPanel(false)} className="btn-brand px-4 py-2">
                  Show {products?.length ?? ''} results
                </button>
              </div>
              {filterPanel}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
