'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LayoutDashboard, LogOut, MapPin, Package, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { useAuth, useToast } from '@/components/providers';
import { OrderLines, OrderTracker, StatusBadge } from '@/components/store/OrderTracker';
import { ProductArt } from '@/components/ProductArt';
import { Empty } from '@/components/store/bits';
import { AuthCard } from '@/components/AuthCard';
import { api } from '@/lib/api';
import { cn, date, inr, STATES } from '@/lib/format';
import type { Order } from '@/lib/types';

export default function AccountPage() {
  return (
    <Suspense>
      <Account />
    </Suspense>
  );
}

function Account() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="container-x py-16"><div className="skeleton mx-auto h-96 max-w-md" /></div>;
  return user ? <Dashboard /> : <AuthCard />;
}

/* ------------- signed-in dashboard ------------- */
function Dashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'orders' | 'addresses' | 'profile'>('orders');
  const tabs = [
    { k: 'orders', l: 'Purchase history', i: Package },
    { k: 'addresses', l: 'Delivery addresses', i: MapPin },
    { k: 'profile', l: 'Profile', i: UserRound },
  ] as const;
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-3xl bg-white p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-3 border-b border-line pb-5">
            <span className="grid size-12 place-items-center rounded-full bg-brand font-display text-lg font-semibold text-white">{user!.name[0]}</span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user!.name}</p>
              <p className="truncate text-xs text-muted">{user!.email}</p>
            </div>
          </div>
          <p className="label mt-5">Your account</p>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {tabs.map(({ k, l, i: I }) => (
              <button key={k} onClick={() => setTab(k)} className={cn('relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition', tab === k ? 'font-semibold text-brand' : 'hover:bg-cream')}>
                {tab === k && <motion.span layoutId="acc-tab" className="absolute inset-0 rounded-xl bg-brand-50" />}
                <I className="relative size-4" />
                <span className="relative">{l}</span>
              </button>
            ))}
            {user!.role === 'ADMIN' && (
              <Link href="/admin" className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-teal hover:bg-mint">
                <LayoutDashboard className="size-4" /> Admin panel
              </Link>
            )}
            <button onClick={logout} className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
              <LogOut className="size-4" /> Sign out
            </button>
          </nav>
        </aside>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
            {tab === 'orders' ? <Orders /> : tab === 'addresses' ? <Addresses /> : <Profile />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    api<Order[]>('/orders/mine').then((o) => {
      setOrders(o);
      setOpen(o[0]?.id || null);
    });
  }, []);
  const list = (orders || []).filter((o) => !q || o.number.includes(q.toUpperCase()) || o.items.some((i) => i.name.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Your Orders</h1>
      <label className="relative mt-5 block max-w-md">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your orders" className="input py-3.5 pr-10" />
        <Search className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted" />
      </label>
      <div className="mt-6 space-y-4">
        {orders === null && <div className="skeleton h-48" />}
        {orders?.length === 0 && <Empty icon={<Package className="size-7" />} title="No orders yet" text="When you place an order it will show up here." action={<Link href="/shop" className="btn-brand">Start shopping</Link>} />}
        {list.map((o) => (
          <motion.div layout key={o.id} className="overflow-hidden rounded-3xl bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-4">
              <div>
                <p className="font-semibold">{date(o.createdAt)}</p>
                <p className="text-sm text-muted">Order #{o.number}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-semibold">{inr(o.total)}</span>
                <StatusBadge status={o.status} />
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((i) => (
                    <span key={i.id} className="size-14 rounded-xl border-2 border-white bg-cream-2 p-1">
                      <ProductArt art={i.art} color={i.colorHex} pattern={i.pattern} image={i.image} className="h-full w-full" />
                    </span>
                  ))}
                </div>
                <p className="min-w-0 flex-1 text-sm font-medium">
                  {o.items[0].name}
                  {o.items.length > 1 && <span className="text-muted"> + {o.items.length - 1} more</span>}
                </p>
                <Link href={`/order/${o.number}`} className="btn-brand px-4 py-2 text-xs">
                  View order
                </Link>
              </div>
              <div className="mt-6">
                <OrderTracker order={o} compact />
              </div>
            </div>
            <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full items-center gap-1.5 border-t border-line px-6 py-3 text-sm text-ink/80 underline-offset-2 hover:underline">
              {open === o.id ? 'Hide details' : 'Show details'} <ChevronDown className={cn('size-4 transition', open === o.id && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {open === o.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-6">
                    <OrderLines order={o} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Addresses() {
  const { addresses, refresh, user } = useAuth();
  const toast = useToast();
  const blank = { fullName: user?.name || '', phone: user?.phone || '', line1: '', line2: '', city: '', state: '', pincode: '' };
  const [f, setF] = useState(blank);
  const [adding, setAdding] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/auth/addresses', { body: f });
      await refresh();
      setAdding(false);
      setF(blank);
      toast('Address saved');
    } catch (err) {
      toast((err as Error).message, 'err');
    }
  };
  const del = async (id: string) => {
    await api(`/auth/addresses/${id}`, { method: 'DELETE' });
    refresh();
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Delivery addresses</h1>
        <button onClick={() => setAdding(!adding)} className="btn-brand">
          <Plus className="size-4" /> Add new
        </button>
      </div>
      <AnimatePresence>
        {adding && (
          <motion.form onSubmit={save} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-5 grid gap-3 rounded-3xl bg-white p-6 sm:grid-cols-2">
              <input required placeholder="Full name" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} className="input" />
              <input required placeholder="Mobile" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="input" />
              <input required placeholder="House no., street" value={f.line1} onChange={(e) => setF({ ...f, line1: e.target.value })} className="input sm:col-span-2" />
              <input placeholder="Area / landmark" value={f.line2} onChange={(e) => setF({ ...f, line2: e.target.value })} className="input sm:col-span-2" />
              <input required placeholder="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className="input" />
              <select required value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} className="input">
                <option value="">State</option>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input required placeholder="Pincode" value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="input" />
              <button className="btn-dark">Save address</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="relative rounded-3xl bg-white p-6 text-sm leading-relaxed">
            {a.isDefault && <span className="mb-2 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand">Default</span>}
            <p className="font-semibold">{a.fullName}</p>
            <p>{a.line1}</p>
            {a.line2 && <p>{a.line2}</p>}
            <p>
              {a.city}, {a.state} {a.pincode}
            </p>
            <p className="text-muted">+91 {a.phone}</p>
            <button onClick={() => del(a.id)} className="absolute top-5 right-5 text-muted hover:text-rose-600" aria-label="Delete address">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {!addresses.length && !adding && <p className="text-muted">No saved addresses yet.</p>}
      </div>
    </div>
  );
}

function Profile() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ name: user!.name, phone: user!.phone || '' });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/auth/me', { method: 'PUT', body: f });
    await refresh();
    toast('Profile updated');
  };
  return (
    <form onSubmit={save} className="max-w-lg">
      <h1 className="font-display text-3xl font-semibold">Profile</h1>
      <div className="mt-6 space-y-4 rounded-3xl bg-white p-6">
        <div>
          <label className="label">Name</label>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input value={user!.email} disabled className="input opacity-60" />
        </div>
        <div>
          <label className="label">Mobile</label>
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="input" />
        </div>
        <button className="btn-brand">Save changes</button>
      </div>
    </form>
  );
}
