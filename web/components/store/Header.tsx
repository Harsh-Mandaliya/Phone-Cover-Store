'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useAuth, useCart, useSettings } from '@/components/providers';
import { api } from '@/lib/api';
import { cn } from '@/lib/format';
import type { Category } from '@/lib/types';
import { ProductArt } from '@/components/ProductArt';

export function Logo({ light }: { light?: boolean }) {
  const s = useSettings();
  return (
    <Link href="/" className="group flex items-center gap-2" aria-label={`${s.storeName} home`}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-brand text-white shadow-[0_6px_16px_-6px_rgba(37,99,235,0.9)] transition-transform group-hover:-rotate-6">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6l-8-3Z" />
          <path d="m8.5 12 2.5 2.5 4.5-5" strokeLinecap="round" />
        </svg>
      </span>
      <span className={cn('font-display text-xl leading-none font-bold tracking-tight', light ? 'text-white' : 'text-ink')}>
        {s.storeName}
        <span className="text-brand">.</span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '#categories', label: 'Categories' },
  { href: '/shop?flag=sale', label: 'Sale' },
  { href: '/track', label: 'Track Order' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const settings = useSettings();
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [mobile, setMobile] = useState(false);
  const [mega, setMega] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 12));

  useEffect(() => {
    api<Category[]>('/categories').then(setCats).catch(() => {});
  }, []);
  useEffect(() => {
    setMobile(false);
    setMega(false);
  }, [path]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
    setMobile(false);
  };

  return (
    <>
      {/* announcement marquee */}
      <div className="overflow-hidden bg-ink py-2 text-xs text-white/90">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="flex items-center gap-12">
              <span>{settings.announcement}</span>
              <span className="text-brand">✦</span>
              <span>New iPhone 17 cases just landed</span>
              <span className="text-brand">✦</span>
            </span>
          ))}
        </div>
      </div>

      <header className={cn('sticky top-0 z-50 transition-all duration-300', scrolled ? 'bg-cream/85 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl' : 'bg-cream')}>
        <div className="container-x flex h-16 items-center gap-4 lg:h-[72px]">
          <button className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-white lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Logo />

          <nav className="ml-8 hidden items-center gap-1 lg:flex">
            {NAV.map((n) =>
              n.label === 'Categories' ? (
                <div key={n.label} className="relative" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
                  <button className="flex items-center gap-1 rounded-full px-3.5 py-2 text-sm text-ink/80 transition hover:text-ink" onClick={() => setMega((m) => !m)} aria-expanded={mega}>
                    Categories <ChevronDown className={cn('size-3.5 transition', mega && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {mega && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18 }}
                        className="absolute top-full left-0 grid w-[560px] grid-cols-2 gap-1 rounded-3xl border border-line bg-white p-3 shadow-2xl"
                      >
                        {cats.map((c) => (
                          <Link key={c.id} href={`/shop?category=${c.slug}`} className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-cream">
                            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream-2 transition group-hover:bg-white">
                              <ProductArt art={c.art} color={c.color} image={c.image} className="h-full w-full" />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold">{c.name}</span>
                              <span className="block text-xs text-muted">{c.count} products</span>
                            </span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn('relative rounded-full px-3.5 py-2 text-sm transition', path === n.href ? 'font-semibold text-ink' : 'text-ink/75 hover:text-ink')}
                >
                  {path === n.href && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-white" />}
                  {n.label}
                </Link>
              ),
            )}
          </nav>

          <form onSubmit={search} className="ml-auto hidden max-w-xs flex-1 md:block">
            <label className="relative block">
              <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases, models…" className="w-full rounded-full border border-transparent bg-white py-2.5 pr-4 pl-10 text-sm outline-none transition focus:border-brand/40 focus:ring-4 focus:ring-brand/10" />
            </label>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <Link href="/account" className="flex items-center gap-2 rounded-full px-2.5 py-2 text-sm hover:bg-white" aria-label="Account">
              <User className="size-5" />
              <span className="hidden max-w-24 truncate xl:inline">{user ? user.name.split(' ')[0] : 'Sign in'}</span>
            </Link>
            <button onClick={() => setOpen(true)} className="relative grid size-10 place-items-center rounded-full hover:bg-white" aria-label={`Cart, ${count} items`}>
              <ShoppingBag className="size-5" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.3 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobile && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMobile(false)} />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-cream-2 p-5"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button onClick={() => setMobile(false)} className="grid size-10 place-items-center rounded-full bg-white" aria-label="Close menu">
                  <X className="size-5" />
                </button>
              </div>
              <form onSubmit={search} className="relative mt-5">
                <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="input rounded-full pl-10" />
              </form>
              <nav className="mt-4 flex flex-col">
                {NAV.filter((n) => n.label !== 'Categories').map((n, i) => (
                  <motion.div key={n.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                    <Link href={n.href} className="block border-b border-line py-3.5 font-display text-lg font-medium">
                      {n.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <p className="label mt-6">Shop by category</p>
              <div className="grid grid-cols-2 gap-2">
                {cats.map((c) => (
                  <Link key={c.id} href={`/shop?category=${c.slug}`} className="flex flex-col items-center gap-1 rounded-2xl bg-white p-3 text-center text-xs font-medium">
                    <span className="size-12 overflow-hidden rounded-xl">
                      <ProductArt art={c.art} color={c.color} image={c.image} className="h-full w-full" />
                    </span>
                    {c.name}
                  </Link>
                ))}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
