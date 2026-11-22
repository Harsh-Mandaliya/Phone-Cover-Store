'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ProductArt } from '@/components/ProductArt';
import { useToast } from '@/components/providers';
import { abtnLine, abtnTeal, ainput, Drawer, Field, PageCard } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/format';
import type { Category } from '@/lib/types';

export default function CategoriesAdmin() {
  const toast = useToast();
  const [list, setList] = useState<Category[]>([]);
  const [edit, setEdit] = useState<Partial<Category> | null>(null);
  const load = () => api<Category[]>('/admin/categories').then(setList);
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      await api(edit!.id ? `/admin/categories/${edit!.id}` : '/admin/categories', { method: edit!.id ? 'PUT' : 'POST', body: edit });
      toast('Category saved');
      setEdit(null);
      load();
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };
  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api(`/admin/categories/${c.id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };

  return (
    <PageCard
      title="Categories"
      sub="These appear in the store menu and the “Shop by Category” section, in this order."
      actions={
        <button onClick={() => setEdit({ art: 'case', color: '#2563EB', sort: list.length })} className={abtnTeal}>
          <Plus className="size-4" /> Add category
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="group flex items-center gap-4 rounded-2xl border border-zinc-200 p-4 transition hover:border-brand">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: `${c.color}1a` }}>
              <ProductArt art={c.art} color={c.color} image={c.image} className="h-full w-full" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.name}</p>
              <p className="truncate text-xs text-zinc-500">{c.tagline}</p>
              <Link href={`/admin/products`} className="text-xs font-medium text-brand-600">
                {c.count} products
              </Link>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEdit(c)} className="grid size-8 place-items-center rounded-full hover:bg-zinc-100" aria-label="Edit">
                <Pencil className="size-4" />
              </button>
              <button onClick={() => remove(c)} className="grid size-8 place-items-center rounded-full text-rose-600 hover:bg-rose-50" aria-label="Delete">
                <Trash2 className="size-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Drawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit category' : 'New category'}
        footer={
          <>
            <button onClick={() => setEdit(null)} className={abtnLine}>Cancel</button>
            <button onClick={save} className={abtnTeal}>Save</button>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <div className="mx-auto grid size-32 place-items-center rounded-3xl p-4" style={{ background: `${edit.color}1a` }}>
              <ProductArt art={edit.art || 'case'} color={edit.color || '#2563EB'} className="h-full w-full" />
            </div>
            <Field label="Name">
              <input value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={ainput} />
            </Field>
            <Field label="Banner photo URL" hint="An https:// image link (e.g. from Pexels/Unsplash or your own site). Shown on the home page category grid.">
              <input value={edit.image || ''} onChange={(e) => setEdit({ ...edit, image: e.target.value })} className={ainput} placeholder="https://…" />
            </Field>
            <Field label="Tagline">
              <input value={edit.tagline || ''} onChange={(e) => setEdit({ ...edit, tagline: e.target.value })} className={ainput} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Icon">
                <select value={edit.art} onChange={(e) => setEdit({ ...edit, art: e.target.value })} className={ainput}>
                  {['case', 'protector', 'watch', 'airpods', 'charger', 'powerbank', 'cable'].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </Field>
              <Field label="Colour">
                <input type="color" value={edit.color} onChange={(e) => setEdit({ ...edit, color: e.target.value })} className={cn(ainput, 'h-[42px] p-1')} />
              </Field>
              <Field label="Order">
                <input type="number" value={edit.sort ?? 0} onChange={(e) => setEdit({ ...edit, sort: +e.target.value })} className={ainput} />
              </Field>
            </div>
          </div>
        )}
      </Drawer>
    </PageCard>
  );
}
