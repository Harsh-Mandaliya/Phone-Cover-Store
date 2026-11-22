'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { downloadTablePdf, rs } from '@/lib/pdf';

import { Boxes, Download, FileText, ImagePlus, Minus, PackageCheck, PackageMinus, PackageX, Pencil, Plus, Trash2, X } from 'lucide-react';
import { ProductArt } from '@/components/ProductArt';
import { useSettings, useToast } from '@/components/providers';
import { abtnLine, abtnTeal, ainput, Drawer, EmptyRow, Field, PageCard, Pill, SearchBox, StatCard, StockBadge, TableWrap, td, th, Toggle } from '@/components/admin/ui';
import { api, assetUrl } from '@/lib/api';
import { cn, csvCell, date, inr } from '@/lib/format';
import type { Category, Color, Product } from '@/lib/types';

export default function ProductsAdmin() {
  return (
    <Suspense>
      <Products />
    </Suspense>
  );
}

const MODEL_PRESETS: Record<string, string[]> = {
  'iPhone 17': ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17', 'iPhone Air'],
  'iPhone 16': ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 16 Plus'],
  'iPhone 15': ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15'],
  'Galaxy S': ['Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25', 'Galaxy S24 Ultra', 'Galaxy S24'],
  Foldables: ['Galaxy Z Fold 7', 'Galaxy Z Flip 7'],
  'Apple Watch': ['Apple Watch 41mm', 'Apple Watch 45mm', 'Apple Watch Ultra 49mm'],
  AirPods: ['AirPods Pro 2', 'AirPods 4'],
};

function Products() {
  const sp = useSearchParams();
  const toast = useToast();
  const [list, setList] = useState<Product[] | null>(null);
  const [all, setAll] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [stock, setStock] = useState(sp.get('stock') || '');
  const [edit, setEdit] = useState<Partial<Product> | null>(null);

  const load = () => {
    const p = new URLSearchParams({ q, category: cat, status, stock });
    api<Product[]>(`/admin/products?${p}`).then(setList);
    api<Product[]>('/admin/products').then(setAll);
  };
  useEffect(() => {
    api<Category[]>('/admin/categories').then(setCats);
  }, []);
  useEffect(() => setStock(sp.get('stock') || ''), [sp]);
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cat, status, stock]);

  const counts = {
    total: all.length,
    in: all.filter((p) => p.stock > p.lowStockAt).length,
    low: all.filter((p) => p.stock > 0 && p.stock <= p.lowStockAt).length,
    out: all.filter((p) => p.stock <= 0).length,
  };

  const adjust = async (p: Product, delta: number) => {
    setList((l) => l?.map((x) => (x.id === p.id ? { ...x, stock: Math.max(0, x.stock + delta) } : x)) || null);
    await api(`/admin/products/${p.id}/stock`, { method: 'PATCH', body: { delta } });
    api<Product[]>('/admin/products').then(setAll);
  };
  const setStockTo = async (p: Product, v: string) => {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return;
    await api(`/admin/products/${p.id}/stock`, { method: 'PATCH', body: { set: n } });
    load();
  };
  const togglePublish = async (p: Product) => {
    await api(`/admin/products/${p.id}/status`, { method: 'PATCH', body: { status: p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' } });
    toast(p.status === 'PUBLISHED' ? `${p.name} hidden from store` : `${p.name} is live`);
    load();
  };
  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone. (Tip: switch it to Draft to just hide it.)`)) return;
    await api(`/admin/products/${p.id}`, { method: 'DELETE' });
    toast('Product deleted');
    load();
  };
  const settings = useSettings();
  const exportPdf = () =>
    list &&
    downloadTablePdf({
      storeName: settings.storeName,
      title: 'Products & stock report',
      subtitle: [cat && cats.find((c) => c.id === cat)?.name, status, stock && { in: 'Available', low: 'Low stock', out: 'Out of stock' }[stock], q && `search "${q}"`].filter(Boolean).join(' · ') || 'All products',
      summary: [
        ['Products', String(list.length)],
        ['Units in stock', String(list.reduce((a, p) => a + p.stock, 0))],
        ['Stock value', rs(list.reduce((a, p) => a + p.stock * p.price, 0))],
        ['Low / out', `${list.filter((p) => p.stock > 0 && p.stock <= p.lowStockAt).length} / ${list.filter((p) => p.stock <= 0).length}`],
      ],
      head: ['SKU', 'Product', 'Category', 'Price', 'MRP', 'Stock', 'Stock status', 'Status'],
      rows: list.map((p) => [p.sku, p.name, p.category?.name || '', rs(p.price), rs(p.mrp), p.stock, p.stock <= 0 ? 'Out of stock' : p.stock <= p.lowStockAt ? 'Low stock' : 'Available', p.status === 'PUBLISHED' ? 'Published' : 'Draft']),
      rightAlign: [3, 4, 5],
      filename: `products-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  const exportCsv = () => {
    const rows = [['SKU', 'Name', 'Category', 'Price', 'MRP', 'Stock', 'Status'], ...(list || []).map((p) => [p.sku, p.name, p.category?.name, p.price, p.mrp, p.stock, p.status])];
    const blob = new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'products.csv';
    a.click();
  };

  return (
    <PageCard
      title="Products & Stock"
      sub="Add products, update prices and keep stock levels in check."
      actions={
        <>
          <button onClick={exportCsv} className={abtnLine}>
            <Download className="size-4" /> CSV
          </button>
          <button onClick={exportPdf} disabled={!list?.length} className={abtnLine}>
            <FileText className="size-4" /> PDF
          </button>
          <button onClick={() => setEdit({ status: 'PUBLISHED', colors: [{ name: 'Midnight Black', hex: '#1E1E1E' }], models: [], images: [], art: 'case', pattern: 'solid', lowStockAt: 5, stock: 10 })} className={abtnTeal}>
            <Plus className="size-4" /> Add Product
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="teal" icon={<Boxes className="size-6" />} label="Total Products" value={counts.total} onClick={() => setStock('')} active={stock === ''} />
        <StatCard tone="yellow" icon={<PackageCheck className="size-6" />} label="In Stock Products" value={counts.in} onClick={() => setStock('in')} active={stock === 'in'} />
        <StatCard tone="green" icon={<PackageMinus className="size-6" />} label="Low Stock Products" value={counts.low} onClick={() => setStock('low')} active={stock === 'low'} />
        <StatCard tone="pink" icon={<PackageX className="size-6" />} label="Out of Stock" value={counts.out} onClick={() => setStock('out')} active={stock === 'out'} />
      </div>

      <div className="my-5 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Search name or SKU…" className="w-full max-w-xs" />
        <div className="ml-auto flex flex-wrap gap-2">
          <Pill label="Category" value={cat} onChange={setCat} options={cats.map((c) => [c.id, c.name])} />
          <Pill label="Status" value={status} onChange={setStatus} options={[['PUBLISHED', 'Published'], ['DRAFT', 'Draft']]} />
          <Pill label="Stock" value={stock} onChange={setStock} options={[['in', 'Available'], ['low', 'Low stock'], ['out', 'Out of stock']]} />
        </div>
      </div>

      <TableWrap>
        <table className="w-full">
          <thead>
            <tr>
              {['Product', 'Category', 'Price', 'Quantity', 'Stock', 'Updated', 'Status', 'Action'].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list === null && <EmptyRow cols={8} text="Loading…" />}
            {list?.length === 0 && <EmptyRow cols={8} text="No products match these filters." />}
            <AnimatePresence initial={false}>
              {list?.map((p) => (
                <motion.tr key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-zinc-50/60">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <span className="size-11 shrink-0 rounded-lg bg-zinc-50 p-1">
                        <ProductArt art={p.art} color={p.colors[0]?.hex} pattern={p.pattern} image={p.images[0]} className="h-full w-full" />
                      </span>
                      <span className="max-w-56">
                        <span className="block truncate font-medium text-zinc-900">{p.name}</span>
                        <span className="text-xs text-zinc-400">#{p.sku}</span>
                      </span>
                    </div>
                  </td>
                  <td className={td}>{p.category?.name}</td>
                  <td className={td}>
                    {inr(p.price)}
                    {p.mrp > p.price && <span className="ml-1 text-xs text-zinc-400 line-through">{inr(p.mrp)}</span>}
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => adjust(p, -1)} className="grid size-7 place-items-center rounded-full border border-zinc-200 hover:bg-zinc-100" aria-label="Decrease stock">
                        <Minus className="size-3" />
                      </button>
                      <input key={p.stock} defaultValue={p.stock} onBlur={(e) => +e.target.value !== p.stock && setStockTo(p, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="w-12 rounded-md border border-transparent text-center hover:border-zinc-200 focus:border-brand focus:outline-none" aria-label="Stock quantity" />
                      <button onClick={() => adjust(p, 1)} className="grid size-7 place-items-center rounded-full border border-zinc-200 hover:bg-zinc-100" aria-label="Increase stock">
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </td>
                  <td className={td}>
                    <StockBadge stock={p.stock} low={p.lowStockAt} />
                  </td>
                  <td className={td}>{p.updatedAt ? date(p.updatedAt) : '—'}</td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <Toggle checked={p.status === 'PUBLISHED'} onChange={() => togglePublish(p)} label="Published" />
                      <span className={cn('text-xs font-medium', p.status === 'PUBLISHED' ? 'text-brand-600' : 'text-zinc-400')}>{p.status === 'PUBLISHED' ? 'Published' : 'Draft'}</span>
                    </div>
                  </td>
                  <td className={td}>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEdit(p)} className={cn(abtnTeal, 'px-3.5 py-1.5')}>
                        <Pencil className="size-3.5" /> Edit
                      </button>
                      <button onClick={() => remove(p)} className={cn(abtnLine, 'px-2.5 py-1.5 text-rose-600')} aria-label="Delete">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </TableWrap>

      <Editor key={edit?.id || (edit ? 'new' : 'none')} product={edit} cats={cats} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />
    </PageCard>
  );
}

function Editor({ product, cats, onClose, onSaved }: { product: Partial<Product> | null; cats: Category[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [p, setP] = useState<Partial<Product>>(product || {});
  const [busy, setBusy] = useState(false);
  const [modelText, setModelText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !product?.id;
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const models = p.models || [];
  const colors = p.colors || [];
  const images = p.images || [];

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const form = new FormData();
      form.append('file', f);
      try {
        urls.push((await api<{ url: string }>('/admin/upload', { form })).url);
      } catch (e) {
        toast((e as Error).message, 'err');
      }
    }
    set('images', [...images, ...urls]);
  };

  const addModels = (list: string[]) => set('models', [...new Set([...models, ...list.map((m) => m.trim()).filter(Boolean)])]);

  const save = async () => {
    setBusy(true);
    try {
      await api(isNew ? '/admin/products' : `/admin/products/${p.id}`, { method: isNew ? 'POST' : 'PUT', body: p });
      toast(isNew ? 'Product created' : 'Product saved');
      onSaved();
    } catch (e) {
      toast((e as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      open={!!product}
      onClose={onClose}
      wide
      title={isNew ? 'Add product' : `Edit · ${product?.name}`}
      footer={
        <>
          <button onClick={onClose} className={abtnLine}>
            Cancel
          </button>
          <button onClick={save} disabled={busy} className={abtnTeal}>
            {busy ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
          </button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1fr_220px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" className="sm:col-span-2">
            <input value={p.name || ''} onChange={(e) => set('name', e.target.value)} className={ainput} placeholder="e.g. Armour Pro MagSafe Case" />
          </Field>
          <Field label="Category">
            <select value={p.categoryId || ''} onChange={(e) => set('categoryId', e.target.value)} className={ainput}>
              <option value="">Choose…</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="SKU" hint={isNew ? 'Leave blank to auto-generate' : undefined}>
            <input value={p.sku || ''} onChange={(e) => set('sku', e.target.value)} className={ainput} />
          </Field>
          <Field label="Selling price (₹)">
            <input type="number" min={0} value={p.price ?? ''} onChange={(e) => set('price', +e.target.value)} className={ainput} />
          </Field>
          <Field label="MRP (₹)" hint="Shown struck-through when higher than price">
            <input type="number" min={0} value={p.mrp ?? ''} onChange={(e) => set('mrp', +e.target.value)} className={ainput} />
          </Field>
          <Field label="Stock quantity">
            <input type="number" min={0} value={p.stock ?? 0} onChange={(e) => set('stock', +e.target.value)} className={ainput} />
          </Field>
          <Field label="Low-stock alert at">
            <input type="number" min={0} value={p.lowStockAt ?? 5} onChange={(e) => set('lowStockAt', +e.target.value)} className={ainput} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea rows={4} value={p.description || ''} onChange={(e) => set('description', e.target.value)} className={cn(ainput, 'resize-none')} />
          </Field>
        </div>

        <div className="space-y-4">
          <div className="grid aspect-square place-items-center rounded-2xl bg-zinc-50 p-4">
            <ProductArt art={p.art || 'case'} color={colors[0]?.hex || '#222'} pattern={p.pattern} image={images[0]} className="h-full w-full" />
          </div>
          <Field label="Illustration (if no photo)">
            <select value={p.art || 'case'} onChange={(e) => set('art', e.target.value)} className={ainput}>
              {['case', 'protector', 'watch', 'airpods', 'charger', 'powerbank', 'cable'].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="Finish">
            <select value={p.pattern || 'solid'} onChange={(e) => set('pattern', e.target.value)} className={ainput}>
              {['solid', 'clear', 'magsafe', 'marble', 'stripes', 'dots'].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <section className="mt-8">
        <p className="mb-2 text-xs font-semibold text-zinc-600">Photos</p>
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={src} className="group relative size-24 overflow-hidden rounded-xl border border-zinc-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(src)} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-brand px-1.5 text-[10px] text-white">Cover</span>}
              <button onClick={() => set('images', images.filter((x) => x !== src))} className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-white/90 opacity-0 shadow group-hover:opacity-100" aria-label="Remove photo">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} className="grid size-24 place-items-center rounded-xl border-2 border-dashed border-zinc-300 text-zinc-400 transition hover:border-brand hover:text-brand">
            <span className="flex flex-col items-center gap-1 text-xs">
              <ImagePlus className="size-6" /> Upload
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
        </div>
        <p className="mt-1.5 text-xs text-zinc-400">PNG/JPG/WEBP up to 5 MB. Stored locally in api/uploads. Without photos the store shows a clean illustration.</p>
      </section>

      <section className="mt-8">
        <p className="mb-2 text-xs font-semibold text-zinc-600">Colours</p>
        <div className="space-y-2">
          {colors.map((c: Color, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="color" value={c.hex} onChange={(e) => set('colors', colors.map((x, k) => (k === i ? { ...x, hex: e.target.value } : x)))} className="size-10 cursor-pointer rounded-lg border border-zinc-200" />
              <input value={c.name} onChange={(e) => set('colors', colors.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} className={ainput} placeholder="Colour name" />
              <button onClick={() => set('colors', colors.filter((_, k) => k !== i))} className="grid size-10 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove colour">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button onClick={() => set('colors', [...colors, { name: 'New colour', hex: '#2563EB' }])} className={cn(abtnLine, 'px-3 py-1.5 text-xs')}>
            <Plus className="size-3.5" /> Add colour
          </button>
        </div>
      </section>

      <section className="mt-8">
        <p className="mb-2 text-xs font-semibold text-zinc-600">Compatible models <span className="font-normal text-zinc-400">— leave empty for universal products (chargers, cables)</span></p>
        <div className="flex flex-wrap gap-1.5">
          {models.map((m) => (
            <span key={m} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600">
              {m}
              <button onClick={() => set('models', models.filter((x) => x !== m))} aria-label={`Remove ${m}`}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={modelText} onChange={(e) => setModelText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addModels(modelText.split(',')); setModelText(''); } }} placeholder="Type a model and press Enter (comma for many)" className={ainput} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-xs text-zinc-400">Quick add:</span>
          {Object.entries(MODEL_PRESETS).map(([k, v]) => (
            <button key={k} onClick={() => addModels(v)} className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs hover:border-brand hover:text-brand">
              + {k}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {(
          [
            ['status', 'Published (visible in store)'],
            ['featured', 'Featured on home page'],
            ['trending', 'Show in Trending'],
            ['isNew', 'Mark as New Arrival'],
          ] as const
        ).map(([k, l]) => (
          <label key={k} className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm">
            {l}
            <Toggle checked={k === 'status' ? p.status !== 'DRAFT' : !!p[k]} onChange={(v) => (k === 'status' ? set('status', v ? 'PUBLISHED' : 'DRAFT') : set(k, v))} label={l} />
          </label>
        ))}
      </section>
    </Drawer>
  );
}
