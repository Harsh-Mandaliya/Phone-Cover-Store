'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { useSettings, useToast } from '@/components/providers';
import { api } from '@/lib/api';
import { Logo } from './Header';

export function Footer() {
  const s = useSettings();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/newsletter', { body: { email } });
      toast('You’re subscribed! Watch your inbox for drops & offers.');
      setEmail('');
    } catch (err) {
      toast((err as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="mt-24">
      <div className="bg-brand">
        <div className="container-x flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
          <div className="text-white">
            <p className="font-display text-2xl font-semibold sm:text-3xl">Get 10% off your first order</p>
            <p className="mt-1 text-sm text-white/80">Join the list for new drops and member-only offers. Use code WELCOME10.</p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-md rounded-full bg-white p-1.5">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" />
            <motion.button whileTap={{ scale: 0.95 }} disabled={busy} className="btn-dark px-5">
              Subscribe <ArrowRight className="size-4" />
            </motion.button>
          </form>
        </div>
      </div>

      <div className="bg-ink text-white/70">
        <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">Premium protection, professional quality. Cases and accessories designed for style and durability.</p>
            <div className="mt-5 flex gap-2">
              {[Instagram, Youtube].map((I, i) => (
                <a key={i} href="#" aria-label="Social link" className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-brand hover:text-white">
                  <I className="size-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-4 font-display font-semibold text-white">Shop</p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['iPhone Cases', '/shop?category=iphone-cases'],
                ['Samsung Cases', '/shop?category=samsung-cases'],
                ['Screen Protectors', '/shop?category=protectors'],
                ['Watch Straps', '/shop?category=watch-straps'],
                ['MagSafe & Chargers', '/shop?category=magsafe-chargers'],
              ].map(([l, h]) => (
                <li key={h}>
                  <Link href={h} className="transition hover:text-brand">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 font-display font-semibold text-white">Help</p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['Track your order', '/track'],
                ['My account', '/account'],
                ['Contact us', '/contact'],
                ['Shipping & returns', '/contact#policies'],
              ].map(([l, h]) => (
                <li key={h}>
                  <Link href={h} className="transition hover:text-brand">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 font-display font-semibold text-white">Visit us</p>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                {s.address}
              </li>
              <li className="flex gap-2.5">
                <Phone className="size-4 shrink-0 text-brand" />
                {s.supportPhone}
              </li>
              <li className="flex gap-2.5">
                <Mail className="size-4 shrink-0 text-brand" />
                {s.supportEmail}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs sm:flex-row">
            <p>
              © {new Date().getFullYear()} {s.storeName}. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white/50">We accept</span>
              {['Cash on Delivery', 'UPI (soon)', 'Cards (soon)'].map((m) => (
                <span key={m} className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/80">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
