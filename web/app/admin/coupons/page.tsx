'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Plus, Scissors, Trash2 } from 'lucide-react';
import { useToast } from '@/components/providers';
import { abtnLine, abtnTeal, ainput, Drawer, Field, PageCard, Toggle } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { cn, date, inr } from '@/lib/format';

type Coupon = { id: string; code: string; type: 'PERCENT' | 'FLAT'; value: number; minOrder: number; maxDiscount: number | null; active: boolean; expiresAt: string | null; usedCount: number; usageLimit: number | null };

export default function CouponsAdmin() {
  const toast = useToast();
  const [list, setList] = useState<Coupon[]>([]);
  const [edit, setEdit] = useState<Partial<Coupon> | null>(null);
  const load = () => api<Coupon[]>('/admin/coupons').then(setList);
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      await api(edit!.id ? `/admin/coupons/${edit!.id}` : '/admin/coupons', { method: edit!.id ? 'PUT' : 'POST', body: { ...edit, expiresAt: edit!.expiresAt?.slice(0, 10) || '' } });
      toast('Coupon saved');
      setEdit(null);
      load();
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };
  const toggle = async (c: Coupon) => {
    await api(`/admin/coupons/${c.id}`, { method: 'PUT', body: { ...c, active: !c.active, expiresAt: c.expiresAt?.slice(0, 10) || '' } });
    load();
  };
  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    await api(`/admin/coupons/${c.id}`, { method: 'DELETE' });
    load();
  };
  const expired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt) < new Date();

  return (
    <PageCard
      title="Coupons"
      sub="Discount codes customers can enter at checkout."
      actions={
        <button onClick={() => setEdit({ type: 'PERCENT', value: 10, minOrder: 0, active: true })} className={abtnTeal}>
          <Plus className="size-4" /> New coupon
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className={cn('relative flex overflow-hidden rounded-2xl border border-zinc-200', (!c.active || expired(c)) && 'opacity-60')}>
            <div className="flex w-28 shrink-0 flex-col items-center justify-center bg-brand p-4 text-white">
              <span className="font-display text-3xl font-bold">{c.type === 'PERCENT' ? `${c.value}%` : inr(c.value)}</span>
              <span className="text-xs opacity-80">OFF</span>
            </div>
            <div className="relative flex-1 border-l-2 border-dashed border-zinc-200 p-4">
              <Scissors className="absolute top-2 -left-[11px] size-5 rotate-90 bg-white text-zinc-300" />
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-lg font-bold tracking-wider">{c.code}</p>
                <Toggle checked={c.active} onChange={() => toggle(c)} label="Active" />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {c.minOrder ? `Min order ${inr(c.minOrder)}` : 'No minimum'}
                {c.maxDiscount ? ` · max ${inr(c.maxDiscount)}` : ''}
              </p>
              <p className="text-xs text-zinc-500">
                Used {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}× · {c.expiresAt ? (expired(c) ? 'Expired' : `Ends ${date(c.expiresAt)}`) : 'No expiry'}
              </p>
              <div className="mt-2 flex gap-1">
                <button onClick={() => setEdit(c)} className="grid size-7 place-items-center rounded-full hover:bg-zinc-100" aria-label="Edit">
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => remove(c)} className="grid size-7 place-items-center rounded-full text-rose-600 hover:bg-rose-50" aria-label="Delete">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Drawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? `Edit ${edit.code}` : 'New coupon'}
        footer={
          <>
            <button onClick={() => setEdit(null)} className={abtnLine}>Cancel</button>
            <button onClick={save} className={abtnTeal}>Save</button>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <Field label="Code">
              <input value={edit.code || ''} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase().replace(/\s/g, '') })} className={cn(ainput, 'font-mono uppercase')} placeholder="DIWALI20" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Coupon['type'] })} className={ainput}>
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FLAT">Flat amount (₹)</option>
                </select>
              </Field>
              <Field label={edit.type === 'FLAT' ? 'Amount (₹)' : 'Percent'}>
                <input type="number" value={edit.value ?? ''} onChange={(e) => setEdit({ ...edit, value: +e.target.value })} className={ainput} />
              </Field>
              <Field label="Minimum order (₹)">
                <input type="number" value={edit.minOrder ?? 0} onChange={(e) => setEdit({ ...edit, minOrder: +e.target.value })} className={ainput} />
              </Field>
              <Field label="Max discount (₹)" hint="Optional cap for % coupons">
                <input type="number" value={edit.maxDiscount ?? ''} onChange={(e) => setEdit({ ...edit, maxDiscount: e.target.value ? +e.target.value : null })} className={ainput} />
              </Field>
            </div>
            <Field label="Total uses allowed" hint="Leave empty for unlimited. Stops a leaked code being used forever.">
              <input type="number" min={1} value={edit.usageLimit ?? ''} onChange={(e) => setEdit({ ...edit, usageLimit: e.target.value ? +e.target.value : null })} className={ainput} />
            </Field>
            <Field label="Expires on" hint="Leave empty for no expiry">
              <input type="date" value={edit.expiresAt?.slice(0, 10) || ''} onChange={(e) => setEdit({ ...edit, expiresAt: e.target.value || null })} className={ainput} />
            </Field>
          </div>
        )}
      </Drawer>
    </PageCard>
  );
}
