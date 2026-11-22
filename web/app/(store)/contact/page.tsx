'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Mail, MapPin, MessageCircle, Phone, RefreshCcw, Send, Truck, Wallet } from 'lucide-react';
import { useSettings, useToast } from '@/components/providers';
import { Heading, Reveal } from '@/components/store/bits';
import { api } from '@/lib/api';

export default function ContactPage() {
  const s = useSettings();
  const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', phone: '', subject: 'Order help', body: '' });
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/contact', { body: f });
      setSent(true);
    } catch (err) {
      toast((err as Error).message, 'err');
    }
  };

  return (
    <div className="container-x py-12 sm:py-16">
      <Reveal>
        <Heading a="We’re here to" b="help" sub="Questions about an order, a product or bulk pricing? Message us — we reply within a few hours." />
      </Reveal>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {[
            { i: Phone, t: 'Call or WhatsApp', v: s.supportPhone },
            { i: Mail, t: 'Email', v: s.supportEmail },
            { i: MapPin, t: 'Visit our store', v: s.address },
            { i: Clock, t: 'Store hours', v: 'Mon – Sat, 11:00 AM – 8:30 PM' },
          ].map(({ i: I, t, v }, k) => (
            <Reveal key={t} delay={k * 0.05} className="flex gap-4 rounded-3xl bg-white p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand">
                <I className="size-5" />
              </span>
              <span>
                <span className="block text-sm text-muted">{t}</span>
                <span className="block font-medium">{v}</span>
              </span>
            </Reveal>
          ))}
        </div>
        <Reveal className="rounded-3xl bg-white p-6 sm:p-8">
          {sent ? (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex h-full flex-col items-center justify-center py-12 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <MessageCircle className="size-8" />
              </span>
              <p className="mt-4 font-display text-2xl font-semibold">Message received!</p>
              <p className="mt-1 text-muted">We&apos;ll get back to you at {f.email}.</p>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <input required placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input" />
              <input required type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="input" />
              <input placeholder="Mobile (optional)" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="input" />
              <select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className="input">
                {['Order help', 'Product question', 'Returns & replacement', 'Bulk / wholesale', 'Other'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <textarea required rows={6} placeholder="How can we help?" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} className="input resize-none sm:col-span-2" />
              <button className="btn-brand h-12 sm:col-span-2">
                <Send className="size-4" /> Send message
              </button>
            </form>
          )}
        </Reveal>
      </div>

      <section id="policies" className="mt-16 scroll-mt-24">
        <Heading a="Shipping &" b="Returns" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { i: Truck, t: 'Shipping', d: 'Orders are packed within 24 hours and delivered in 3–5 working days across India. Free shipping on orders above ₹999.' },
            { i: Wallet, t: 'Cash on Delivery', d: 'Pay in cash or UPI when your order arrives. Online prepaid payments are coming soon.' },
            { i: RefreshCcw, t: '7-day replacement', d: 'Wrong model, damaged or defective? Message us within 7 days of delivery with a photo and we’ll replace it free.' },
          ].map(({ i: I, t, d }) => (
            <div key={t} className="rounded-3xl bg-white p-6">
              <I className="size-6 text-brand" />
              <p className="mt-3 font-display text-lg font-semibold">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
