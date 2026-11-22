'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Phone, Plus, Trash2, Truck } from 'lucide-react';
import { useToast } from '@/components/providers';
import { abtnLine, abtnTeal, ainput, Drawer, Field, PageCard, Toggle } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/format';
import type { Partner } from '@/lib/types';

export default function PartnersAdmin() {
  const toast = useToast();
  const [list, setList] = useState<Partner[]>([]);
  const [edit, setEdit] = useState<Partial<Partner> | null>(null);
  const load = () => api<Partner[]>('/admin/partners').then(setList);
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      await api(edit!.id ? `/admin/partners/${edit!.id}` : '/admin/partners', { method: edit!.id ? 'PUT' : 'POST', body: edit });
      toast('Delivery partner saved');
      setEdit(null);
      load();
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };
  const remove = async (p: Partner) => {
    if (!confirm(`Remove ${p.name}? Orders already assigned keep their tracking number.`)) return;
    await api(`/admin/partners/${p.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <PageCard
      title="Delivery Partners"
      sub="Couriers and your own riders. Assign them to orders when you mark an order as shipped."
      actions={
        <button onClick={() => setEdit({ active: true, codSupported: true, trackingUrl: '' })} className={abtnTeal}>
          <Plus className="size-4" /> Add partner
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cn('rounded-2xl border p-5', p.active ? 'border-zinc-200' : 'border-dashed border-zinc-300 opacity-60')}>
            <div className="flex items-start gap-3">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Truck className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-zinc-500">{p.contactPerson || 'No contact person'}</p>
              </div>
              <button onClick={() => setEdit(p)} className="grid size-8 place-items-center rounded-full hover:bg-zinc-100" aria-label="Edit">
                <Pencil className="size-4" />
              </button>
              <button onClick={() => remove(p)} className="grid size-8 place-items-center rounded-full text-rose-600 hover:bg-rose-50" aria-label="Delete">
                <Trash2 className="size-4" />
              </button>
            </div>
            {p.phone && (
              <a href={`tel:${p.phone}`} className="mt-3 flex items-center gap-2 text-sm text-zinc-600 hover:text-brand">
                <Phone className="size-4" /> {p.phone}
              </a>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <Link href={`/admin/orders?status=SHIPPED`} className="rounded-xl bg-zinc-50 p-3 hover:bg-brand-50">
                <p className="font-display text-xl font-semibold">{p.active_orders}</p>
                <p className="text-xs text-zinc-500">In transit</p>
              </Link>
              <div className="rounded-xl bg-zinc-50 p-3">
                <p className="font-display text-xl font-semibold">{p.delivered}</p>
                <p className="text-xs text-zinc-500">Delivered</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              <span className={cn('rounded-md px-2 py-0.5', p.codSupported ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500')}>{p.codSupported ? 'COD supported' : 'Prepaid only'}</span>
              <span className={cn('rounded-md px-2 py-0.5', p.trackingUrl ? 'bg-sky-50 text-sky-700' : 'bg-zinc-100 text-zinc-500')}>{p.trackingUrl ? 'Tracking link' : 'No tracking link'}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <Drawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit partner' : 'New delivery partner'}
        footer={
          <>
            <button onClick={() => setEdit(null)} className={abtnLine}>Cancel</button>
            <button onClick={save} className={abtnTeal}>Save</button>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <Field label="Name">
              <input value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={ainput} placeholder="e.g. Delhivery, Shadowfax, Own rider" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact person">
                <input value={edit.contactPerson || ''} onChange={(e) => setEdit({ ...edit, contactPerson: e.target.value })} className={ainput} />
              </Field>
              <Field label="Phone">
                <input value={edit.phone || ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} className={ainput} />
              </Field>
            </div>
            <Field label="Tracking link template" hint="Use {tracking} where the AWB number goes, e.g. https://courier.com/track?awb={tracking}. Customers see a “Track package” button.">
              <input value={edit.trackingUrl || ''} onChange={(e) => setEdit({ ...edit, trackingUrl: e.target.value })} className={ainput} />
            </Field>
            <label className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm">
              Collects Cash on Delivery
              <Toggle checked={edit.codSupported !== false} onChange={(v) => setEdit({ ...edit, codSupported: v })} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm">
              Active (available to assign)
              <Toggle checked={edit.active !== false} onChange={(v) => setEdit({ ...edit, active: v })} />
            </label>
          </div>
        )}
      </Drawer>
    </PageCard>
  );
}
