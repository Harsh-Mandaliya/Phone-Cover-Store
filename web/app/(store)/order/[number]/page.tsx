'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, PackageSearch } from 'lucide-react';
import { useAuth, useToast } from '@/components/providers';
import { OrderLines, OrderTracker, StatusBadge } from '@/components/store/OrderTracker';
import { Empty } from '@/components/store/bits';
import { api } from '@/lib/api';
import { date, deliveryEta } from '@/lib/format';
import type { Order } from '@/lib/types';

export default function OrderPage() {
  return (
    <Suspense>
      <OrderView />
    </Suspense>
  );
}

function OrderView() {
  const { number } = useParams<{ number: string }>();
  const fresh = useSearchParams().get('new') === '1';
  const { ready } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const phone = typeof window !== 'undefined' ? sessionStorage.getItem(`kv_order_${number}`) || '' : '';

  const load = () =>
    api<Order>(`/orders/${number}${phone ? `?phone=${phone}` : ''}`)
      .then(setOrder)
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, number]);

  const cancel = async () => {
    if (!confirm('Cancel this order?')) return;
    try {
      await api(`/orders/${number}/cancel`, { body: { phone } });
      toast('Your order has been cancelled.');
      load();
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };

  if (error)
    return (
      <div className="container-x py-16">
        <Empty icon={<PackageSearch className="size-7" />} title="Order not found" text="Sign in to the account you ordered with, or track it using your order number and phone." action={<Link href="/track" className="btn-brand">Track an order</Link>} />
      </div>
    );
  if (!order) return <div className="container-x py-16"><div className="skeleton mx-auto h-96 max-w-3xl" /></div>;

  return (
    <div className="container-x max-w-4xl py-10 sm:py-14">
      {fresh && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mb-8 overflow-hidden rounded-[2rem] bg-brand p-8 text-center text-white sm:p-12">
          <Confetti />
          <motion.svg viewBox="0 0 52 52" className="mx-auto size-20" initial="h" animate="v">
            <motion.circle cx="26" cy="26" r="24" fill="none" stroke="white" strokeWidth="3" variants={{ h: { pathLength: 0 }, v: { pathLength: 1, transition: { duration: 0.6 } } }} />
            <motion.path d="M15 27 l7 7 l15 -15" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" variants={{ h: { pathLength: 0 }, v: { pathLength: 1, transition: { delay: 0.5, duration: 0.4 } } }} />
          </motion.svg>
          <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Thank you, {order.customerName.split(' ')[0]}!</h1>
          <p className="mt-2 text-white/85">Your order is placed. We&apos;ve sent the details to {order.email}.</p>
          <p className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm">
            Expected delivery: <b>{deliveryEta(new Date(order.createdAt))}</b>
          </p>
        </motion.div>
      )}

      <div className="grid gap-6">
        <section className="rounded-3xl bg-white p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Order #{order.number}</p>
              <p className="font-display text-xl font-semibold">Placed on {date(order.createdAt)}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <OrderTracker order={order} />
          {['PLACED', 'CONFIRMED'].includes(order.status) && (
            <button onClick={cancel} className="mt-6 text-sm font-medium text-rose-600 hover:underline">
              Cancel order
            </button>
          )}
        </section>
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl bg-white p-6">
            <p className="mb-2 font-display text-lg font-semibold">Items</p>
            <OrderLines order={order} />
          </section>
          <section className="h-fit rounded-3xl bg-white p-6">
            <p className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <MapPin className="size-4 text-brand" /> Delivering to
            </p>
            <p className="text-sm leading-relaxed">
              <b>{order.customerName}</b>
              <br />
              {order.line1}
              {order.line2 && (
                <>
                  <br />
                  {order.line2}
                </>
              )}
              <br />
              {order.city}, {order.state} {order.pincode}
              <br />
              <span className="text-muted">+91 {order.phone}</span>
            </p>
            <div className="mt-6 grid gap-2">
              <Link href="/shop" className="btn-brand">
                Continue shopping
              </Link>
              <Link href="/account" className="btn-line">
                My orders
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const bits = Array.from({ length: 28 });
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {bits.map((_, i) => (
        <motion.span
          key={i}
          className="absolute top-0 block h-3 w-1.5 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, background: ['#fff', '#0F172A', '#93C5FD', '#DBEAFE'][i % 4] }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: 420, rotate: 360 * (i % 2 ? 1 : -1), opacity: 0 }}
          transition={{ duration: 2.2 + (i % 5) * 0.3, delay: (i % 7) * 0.08, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
