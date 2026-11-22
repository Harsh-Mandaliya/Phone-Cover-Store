'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '@/components/providers';
import { abtnTeal, ainput, Field, PageCard, Toggle } from '@/components/admin/ui';
import { api } from '@/lib/api';
import type { Settings } from '@/lib/types';

export default function SettingsAdmin() {
  const toast = useToast();
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => {
    api<Settings>('/admin/settings').then(setS);
  }, []);
  if (!s) return null;
  const up = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS({ ...s, [k]: e.target.value });
  const save = async () => {
    await api('/admin/settings', { method: 'PUT', body: s });
    toast('Settings saved — refresh the store to see changes');
  };
  return (
    <PageCard
      title="Store Settings"
      sub="Store details, shipping charges and payment options."
      actions={
        <button onClick={save} className={abtnTeal}>
          <Save className="size-4" /> Save settings
        </button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <p className="font-semibold">Store details</p>
          <Field label="Store name">
            <input value={s.storeName} onChange={up('storeName')} className={ainput} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Support phone">
              <input value={s.supportPhone} onChange={up('supportPhone')} className={ainput} />
            </Field>
            <Field label="Support email">
              <input value={s.supportEmail} onChange={up('supportEmail')} className={ainput} />
            </Field>
          </div>
          <Field label="Store address">
            <textarea rows={2} value={s.address} onChange={up('address')} className={`${ainput} resize-none`} />
          </Field>
          <Field label="Announcement bar text">
            <input value={s.announcement} onChange={up('announcement')} className={ainput} />
          </Field>
        </section>
        <section className="space-y-4">
          <p className="font-semibold">Shipping & payment</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Shipping fee (₹)">
              <input type="number" value={s.shippingFee} onChange={up('shippingFee')} className={ainput} />
            </Field>
            <Field label="Free shipping above (₹)">
              <input type="number" value={s.freeShippingAbove} onChange={up('freeShippingAbove')} className={ainput} />
            </Field>
          </div>
          <label className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm">
            Accept Cash on Delivery
            <Toggle checked={s.codEnabled === 'true'} onChange={(v) => setS({ ...s, codEnabled: String(v) })} />
          </label>
          <Field label="COD handling fee (₹)" hint="Set 0 for no extra charge">
            <input type="number" value={s.codFee} onChange={up('codFee')} className={ainput} />
          </Field>
          <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
            <p className="font-semibold text-zinc-800">Online payments</p>
            <p className="mt-1">UPI / card payments (e.g. Razorpay) are not connected yet. When you’re ready, the API has a single place to add it: the order creation route.</p>
          </div>
        </section>
      </div>
    </PageCard>
  );
}
