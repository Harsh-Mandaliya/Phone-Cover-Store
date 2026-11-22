'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Stars } from '@/components/store/bits';
import { abtnLine, PageCard, Pill } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { cn, date } from '@/lib/format';
import type { Review } from '@/lib/types';

export default function ReviewsAdmin() {
  const [list, setList] = useState<Review[]>([]);
  const [filter, setFilter] = useState('');
  const load = () => api<Review[]>('/admin/reviews').then(setList);
  useEffect(() => {
    load();
  }, []);
  const shown = list.filter((r) => (filter === 'hidden' ? !r.approved : filter === 'low' ? r.rating <= 3 : true)).sort((a, b) => Number(!!a.approved) - Number(!!b.approved));
  const pending = list.filter((r) => !r.approved).length;

  const toggle = async (r: Review) => {
    setList((l) => l.map((x) => (x.id === r.id ? { ...x, approved: !x.approved } : x)));
    await api(`/admin/reviews/${r.id}`, { method: 'PATCH', body: { approved: !r.approved } });
  };
  const remove = async (r: Review) => {
    if (!confirm('Delete this review permanently?')) return;
    await api(`/admin/reviews/${r.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <PageCard title="Product Reviews" sub={`${pending} waiting for approval. Verified buyers are published automatically; guest reviews wait here so fake or spam reviews never go live.`} actions={<Pill label="All reviews" value={filter} onChange={setFilter} options={[['hidden', 'Waiting / hidden'], ['low', '3★ and below']]} />}>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {shown.map((r) => (
            <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className={cn('flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 sm:flex-row sm:items-center', !r.approved && 'bg-zinc-50 opacity-70')}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <b>{r.name}</b>
                  <Stars value={r.rating} size={13} />
                  <span className="text-xs text-zinc-400">{date(r.createdAt)}</span>
                  {r.verified && <span className="rounded bg-emerald-50 px-1.5 text-xs text-emerald-700">Verified buyer</span>}
                  {!r.approved && <span className="rounded bg-amber-100 px-1.5 text-xs text-amber-800">Awaiting approval</span>}
                </div>
                <p className="mt-1 text-sm text-zinc-700">{r.comment}</p>
                {r.product && (
                  <Link href={`/product/${r.product.slug}`} target="_blank" className="text-xs font-medium text-brand-600">
                    {r.product.name}
                  </Link>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(r)} className={cn(abtnLine, 'px-3 py-1.5')}>
                  {r.approved ? <EyeOff className="size-4" /> : <Eye className="size-4" />} {r.approved ? 'Hide' : 'Approve'}
                </button>
                <button onClick={() => remove(r)} className={cn(abtnLine, 'px-2.5 py-1.5 text-rose-600')} aria-label="Delete">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {!shown.length && <p className="py-12 text-center text-sm text-zinc-400">No reviews here.</p>}
      </div>
    </PageCard>
  );
}
