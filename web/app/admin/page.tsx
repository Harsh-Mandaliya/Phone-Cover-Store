'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Clock, IndianRupee, PackageX, ShoppingCart, Users } from 'lucide-react';
import { ProductArt } from '@/components/ProductArt';
import { StatusBadge } from '@/components/store/OrderTracker';
import { StatCard } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { date, FLOW, inr, STATUS } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';

type Stats = {
  revenue: number;
  orders: number;
  pending: number;
  customers: number;
  byStatus: Record<string, number>;
  days: { date: string; revenue: number; orders: number }[];
  recent: Order[];
  top: { name: string; sold: number }[];
  lowStock: { id: string; name: string; stock: number; art: string; pattern: string; colors: { hex: string }[]; images: string[] }[];
  stock: { total: number; inStock: number; low: number; out: number };
};

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    api<Stats>('/admin/stats').then(setS);
  }, []);
  if (!s) return <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div>;

  const max = Math.max(...s.days.map((d) => d.revenue), 1);
  const week = s.days.slice(-7).reduce((a, d) => a + d.revenue, 0);
  const prev = s.days.slice(0, 7).reduce((a, d) => a + d.revenue, 0);
  const change = prev ? Math.round(((week - prev) / prev) * 100) : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</h1>
        <p className="text-sm text-zinc-500">Here&apos;s what&apos;s happening in your store today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="teal" icon={<IndianRupee className="size-6" />} label="Total revenue" value={inr(s.revenue)} hint={`${change >= 0 ? '▲' : '▼'} ${Math.abs(change)}% vs last week`} />
        <StatCard tone="yellow" icon={<ShoppingCart className="size-6" />} label="Total orders" value={s.orders} />
        <StatCard tone="green" icon={<Clock className="size-6" />} label="To be shipped" value={s.pending} hint="Placed, confirmed or packed" />
        <StatCard tone="pink" icon={<Users className="size-6" />} label="Customers" value={s.customers} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-3xl bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-display text-lg font-semibold">Revenue · last 14 days</p>
              <p className="text-sm text-zinc-500">This week {inr(week)}</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-medium text-brand-600">
              All orders →
            </Link>
          </div>
          <div className="mt-6 flex h-56 items-end gap-1.5 sm:gap-3">
            {s.days.map((d, i) => (
              <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 18 }}
                  className="rounded-t-lg bg-brand/80 transition group-hover:bg-brand"
                />
                <span className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-zinc-900 px-2 py-1 text-[11px] whitespace-nowrap text-white opacity-0 transition group-hover:opacity-100">
                  {inr(d.revenue)} · {d.orders} orders
                </span>
                <span className="mt-2 text-center text-[10px] text-zinc-400">{new Date(d.date).getDate()}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6">
          <p className="font-display text-lg font-semibold">Order pipeline</p>
          <div className="mt-5 space-y-3">
            {[...FLOW, 'CANCELLED' as OrderStatus].map((st) => {
              const n = s.byStatus[st] || 0;
              return (
                <Link key={st} href={`/admin/orders?status=${st}`} className="group flex items-center gap-3">
                  <span className="w-32 text-sm text-zinc-600 group-hover:text-brand">{STATUS[st].label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                    <motion.span initial={{ width: 0 }} animate={{ width: `${(n / Math.max(1, s.orders)) * 100}%` }} className={`block h-full rounded-full ${STATUS[st].dot}`} />
                  </span>
                  <span className="w-6 text-right text-sm font-semibold">{n}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-3xl bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Recent orders</p>
            <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-medium text-brand-600">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {s.recent.map((o) => (
              <Link key={o.id} href={`/admin/orders?open=${o.id}`} className="flex items-center gap-3 py-3 transition hover:bg-zinc-50">
                <span className="size-11 shrink-0 rounded-xl bg-zinc-50 p-1">
                  {o.items[0] && <ProductArt art={o.items[0].art} color={o.items[0].colorHex} pattern={o.items[0].pattern} image={o.items[0].image} className="h-full w-full" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{o.customerName}</span>
                  <span className="block text-xs text-zinc-500">
                    #{o.number} · {date(o.createdAt, true)}
                  </span>
                </span>
                <span className="hidden text-sm font-semibold sm:block">{inr(o.total)}</span>
                <StatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 font-display text-lg font-semibold">
                <AlertTriangle className="size-5 text-amber-500" /> Low stock
              </p>
              <Link href="/admin/products?stock=low" className="text-sm font-medium text-brand-600">
                Restock →
              </Link>
            </div>
            {s.lowStock.length === 0 && <p className="text-sm text-zinc-500">All products are well stocked 🎉</p>}
            <ul className="space-y-3">
              {s.lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="size-10 shrink-0 rounded-lg bg-zinc-50 p-1">
                    <ProductArt art={p.art} color={p.colors[0]?.hex} pattern={p.pattern} image={p.images[0]} className="h-full w-full" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${p.stock <= 0 ? 'bg-rose-600 text-white' : 'bg-amber-400'}`}>{p.stock <= 0 ? 'Out' : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600">
              <PackageX className="size-4" /> {s.stock.out} out of stock · {s.stock.low} low · {s.stock.inStock} healthy
            </div>
          </section>
          <section className="rounded-3xl bg-white p-6">
            <p className="mb-4 font-display text-lg font-semibold">Best sellers</p>
            <ol className="space-y-2.5">
              {s.top.map((t, i) => (
                <li key={t.name} className="flex items-center gap-3 text-sm">
                  <span className="grid size-6 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">{i + 1}</span>
                  <span className="flex-1 truncate">{t.name}</span>
                  <span className="font-semibold">{t.sold} sold</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
