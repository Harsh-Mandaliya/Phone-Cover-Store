'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth, useToast } from '@/components/providers';
import { ProductArt } from '@/components/ProductArt';
import { cn } from '@/lib/format';

export function AuthCard({ admin }: { admin?: boolean }) {
  const { login, register } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = mode === 'login' ? await login(f.email, f.password) : await register(f);
      toast(`Welcome${mode === 'login' ? ' back' : ''}, ${u.name.split(' ')[0]}!`);
      if (next) router.push(next);
    } catch (err) {
      toast((err as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('grid place-items-center px-4', admin ? 'min-h-screen bg-sidebar' : 'py-14 sm:py-20')}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-xl md:grid-cols-2">
        <div className={cn('relative hidden overflow-hidden p-10 text-white md:block', admin ? 'bg-sidebar' : 'bg-brand')}>
          <p className="font-display text-3xl leading-tight font-semibold">{admin ? 'Store admin' : mode === 'login' ? 'Welcome back!' : 'Join the club'}</p>
          <p className="mt-3 text-sm text-white/80">{admin ? 'Manage products, stock, orders and deliveries in one place.' : 'Track orders, save addresses and check out in seconds.'}</p>
          {[
            ['#1E1E1E', 'left-6 bottom-6 w-32 -rotate-12'],
            ['#F1F5F9', 'left-32 bottom-14 w-36 rotate-6'],
          ].map(([c, cls], i) => (
            <motion.div key={i} className={`absolute ${cls}`} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.15 }}>
              <ProductArt art="case" color={c} pattern={i ? 'clear' : 'magsafe'} className="w-full drop-shadow-2xl" />
            </motion.div>
          ))}
        </div>
        <form onSubmit={submit} className="p-7 sm:p-10">
          {!admin && (
            <div className="mb-8 flex rounded-full bg-cream p-1">
              {(['login', 'register'] as const).map((m) => (
                <button type="button" key={m} onClick={() => setMode(m)} className="relative flex-1 rounded-full py-2 text-sm font-medium">
                  {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-full bg-white shadow-sm" />}
                  <span className="relative">{m === 'login' ? 'Sign in' : 'Create account'}</span>
                </button>
              ))}
            </div>
          )}
          {admin && <p className="mb-6 font-display text-2xl font-semibold">Admin sign in</p>}
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 overflow-hidden">
                  <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Full name" className="input" autoComplete="name" />
                  <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Mobile (optional)" className="input" inputMode="numeric" />
                </motion.div>
              )}
            </AnimatePresence>
            <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email address" className="input" autoComplete="email" />
            <input required type="password" minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder={mode === 'register' ? 'Password (8+ characters)' : 'Password'} className="input" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>
          <button disabled={busy} className={cn('mt-6 h-12 w-full', admin ? 'btn bg-brand text-white hover:bg-brand-600' : 'btn-brand')}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
          {!admin && (
            <p className="mt-6 text-center text-xs text-muted">
              Just want to check an order? <Link href="/track" className="font-medium text-brand">Track without signing in</Link>
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}

