'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PackageSearch, Search } from 'lucide-react';
import { useToast } from '@/components/providers';
import { OrderLines, OrderTracker, StatusBadge } from '@/components/store/OrderTracker';
import { api } from '@/lib/api';
import { date } from '@/lib/format';
import type { Order } from '@/lib/types';

export default function TrackPage() {
  const toast = useToast();
  const [number, setNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);

  const find = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      setOrder(await api<Order>(`/orders/${encodeURIComponent(number.trim())}?phone=${phone}`));
    } catch (err) {
      setOrder(null);
      toast((err as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x max-w-3xl py-12 sm:py-16">
      <div className="text-center">
        <motion.span initial={{ scale: 0.6, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand text-white">
          <PackageSearch className="size-8" />
        </motion.span>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">Track your order</h1>
        <p className="mt-2 text-muted">Enter the order number from your confirmation and the mobile number used at checkout.</p>
      </div>
      <form onSubmit={find} className="mt-8 grid gap-3 rounded-3xl bg-white p-5 sm:grid-cols-[1fr_1fr_auto]">
        <input required value={number} onChange={(e) => setNumber(e.target.value.toUpperCase())} placeholder="Order no. e.g. AW2611221234" className="input" />
        <input required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10-digit mobile" className="input" />
        <button disabled={busy} className="btn-brand h-12">
          <Search className="size-4" /> {busy ? 'Finding…' : 'Track'}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {order && (
          <motion.div key={order.id + order.status} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 space-y-6">
            <section className="rounded-3xl bg-white p-6 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">Order #{order.number}</p>
                  <p className="font-display text-xl font-semibold">Placed on {date(order.createdAt)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <OrderTracker order={order} />
            </section>
            <section className="rounded-3xl bg-white p-6">
              <OrderLines order={order} />
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
