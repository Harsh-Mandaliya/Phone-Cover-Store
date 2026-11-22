'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronLeft,
  ExternalLink,
  FolderTree,
  Inbox,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  Search,
  Settings,
  ShoppingCart,
  TicketPercent,
  Truck,
  Users,
} from 'lucide-react';
import { useAuth, useSettings } from '@/components/providers';
import { AuthCard } from '@/components/AuthCard';
import { api } from '@/lib/api';
import { cn } from '@/lib/format';

const NAV = [
  { items: [{ href: '/admin', label: 'Dashboard', icon: LayoutGrid }] },
  {
    group: 'Product management',
    items: [
      { href: '/admin/products', label: 'Products & Stock', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree },
      { href: '/admin/reviews', label: 'Product Reviews', icon: MessageSquareText },
    ],
  },
  {
    group: 'Order management',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, badge: 'pending' },
      { href: '/admin/partners', label: 'Delivery Partners', icon: Truck },
    ],
  },
  { group: 'User management', items: [{ href: '/admin/customers', label: 'Customers', icon: Users }] },
  { group: 'Promotional deals', items: [{ href: '/admin/coupons', label: 'Coupons', icon: TicketPercent }] },
  {
    group: 'Help & support',
    items: [
      { href: '/admin/inbox', label: 'Inbox', icon: Inbox, badge: 'unread' },
      { href: '/admin/settings', label: 'Store Settings', icon: Settings },
    ],
  },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const settings = useSettings();
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [counts, setCounts] = useState({ pending: 0, unread: 0, newOrders: 0 });
  const [q, setQ] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  useEffect(() => {
    if (!isAdmin) return;
    const load = () => api<{ pending: number; unread: number; newOrders: number }>('/admin/stats').then((s) => setCounts({ pending: s.pending, unread: s.unread, newOrders: s.newOrders })).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [isAdmin, path]);
  useEffect(() => setMobile(false), [path]);

  if (!ready) return <div className="grid min-h-screen place-items-center bg-[#F1F5F9]"><span className="size-10 animate-spin rounded-full border-4 border-brand/20 border-t-teal" /></div>;
  if (!user) return <AuthCard admin />;
  if (!isAdmin)
    return (
      <div className="grid min-h-screen place-items-center bg-[#F1F5F9] p-6 text-center">
        <div className="rounded-3xl bg-white p-10">
          <p className="font-display text-2xl font-semibold">Admins only</p>
          <p className="mt-2 text-sm text-zinc-500">You are signed in as {user.email}, which is a customer account.</p>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={logout} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">Sign in as admin</button>
            <Link href="/" className="rounded-full border px-5 py-2 text-sm">Back to store</Link>
          </div>
        </div>
      </div>
    );

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-white">
      <div className="flex h-[72px] items-center gap-2.5 px-6">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
            <path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6l-8-3Z" />
            <path d="m8.5 12 2.5 2.5 4.5-5" strokeLinecap="round" />
          </svg>
        </span>
        {!collapsed && (
          <span className="font-display text-xl font-bold">
            {settings.storeName} <span className="text-xs font-medium text-white/60">admin</span>
          </span>
        )}
      </div>
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-6">
        {NAV.map((g, gi) => (
          <div key={gi} className="mt-4">
            {'group' in g && !collapsed && <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-[#93C5FD] uppercase">{g.group}</p>}
            {g.items.map((it) => {
              const active = it.href === '/admin' ? path === '/admin' : path.startsWith(it.href);
              const Icon = it.icon;
              const badge = 'badge' in it ? counts[it.badge as 'pending' | 'unread'] : 0;
              return (
                <Link key={it.href} href={it.href} title={collapsed ? it.label : undefined} className={cn('relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition', active ? 'text-brand-600' : 'text-white/80 hover:bg-white/10 hover:text-white')}>
                  {active && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-brand-50" transition={{ type: 'spring', stiffness: 400, damping: 35 }} />}
                  <Icon className="relative size-5 shrink-0" />
                  {!collapsed && <span className="relative flex-1">{it.label}</span>}
                  {badge > 0 && <span className={cn('relative grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white', collapsed && 'absolute top-1 right-1')}>{badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10">
          <ExternalLink className="size-5" /> {!collapsed && 'View store'}
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10">
          <LogOut className="size-5" /> {!collapsed && 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans">
      <aside className={cn('fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-300 lg:block print:hidden', collapsed ? 'w-[84px]' : 'w-[272px]')}>
        {sidebar}
        <button onClick={() => setCollapsed(!collapsed)} aria-label="Collapse sidebar" className="absolute top-5 -right-4 grid size-8 place-items-center rounded-full bg-white text-zinc-700 shadow ring-1 ring-zinc-200">
          <ChevronLeft className={cn('size-4 transition', collapsed && 'rotate-180')} />
        </button>
      </aside>
      <AnimatePresence>
        {mobile && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobile(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }} className="absolute inset-y-0 left-0 w-[272px]">
              {sidebar}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn('transition-[padding] duration-300 print:p-0', collapsed ? 'lg:pl-[84px]' : 'lg:pl-[272px]')}>
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-zinc-200/60 bg-white/90 px-4 backdrop-blur sm:px-8 print:hidden">
          <button onClick={() => setMobile(true)} className="grid size-10 place-items-center rounded-full hover:bg-zinc-100 lg:hidden" aria-label="Menu">
            <Menu className="size-5" />
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/admin/orders?q=${encodeURIComponent(q)}`);
            }}
            className="relative hidden max-w-sm flex-1 sm:block"
          >
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders by no., name or phone…" className="w-full rounded-full border border-zinc-200 py-2.5 pr-4 pl-11 text-sm outline-none focus:border-brand" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/inbox" className="relative grid size-10 place-items-center rounded-full hover:bg-zinc-100" aria-label="Inbox">
              <MessageSquareText className="size-5" />
              {counts.unread > 0 && <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-amber-400 text-[10px] font-bold">{counts.unread}</span>}
            </Link>
            <Link href="/admin/orders?status=PLACED" title={`${counts.newOrders} new order(s) to confirm`} className="relative grid size-10 place-items-center rounded-full hover:bg-zinc-100" aria-label="New orders">
              <Bell className="size-5" />
              {counts.newOrders > 0 && <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-rose-600 text-[10px] font-bold text-white">{counts.newOrders}</span>}
            </Link>
            <div className="ml-2 flex items-center gap-3 border-l border-zinc-200 pl-4">
              <span className="grid size-9 place-items-center rounded-full bg-brand-50 font-semibold text-brand-600">{user.name[0]}</span>
              <span className="hidden text-sm leading-tight sm:block">
                <span className="block font-semibold">{user.name}</span>
                <span className="text-xs text-zinc-500">Store Admin</span>
              </span>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
