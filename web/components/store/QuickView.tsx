'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Truck, X } from 'lucide-react';
import { ProductArt } from '@/components/ProductArt';
import { useCart, useToast } from '@/components/providers';
import { inr, off } from '@/lib/format';
import type { Product } from '@/lib/types';
import { ModelPicker, ColorPicker } from './pickers';
import { Qty, Stars } from './bits';

export function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return <AnimatePresence>{product && <Inner key={product.id} p={product} onClose={onClose} />}</AnimatePresence>;
}

function Inner({ p, onClose }: { p: Product; onClose: () => void }) {
  const { add } = useCart();
  const toast = useToast();
  const [color, setColor] = useState(p.colors[0]?.name);
  const [model, setModel] = useState<string | undefined>(p.models.length === 1 ? p.models[0] : undefined);
  const [qty, setQty] = useState(1);
  const hex = p.colors.find((c) => c.name === color)?.hex || p.colors[0]?.hex;

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const submit = () => {
    if (p.models.length && !model) return toast('Please choose your phone model first.', 'err');
    add(p, { color, model, qty });
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal
        aria-label={p.name}
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative grid max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl md:grid-cols-2"
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-full bg-white/80 hover:bg-cream">
          <X className="size-5" />
        </button>
        <div className="grid place-items-center bg-cream p-10">
          <motion.div key={hex} initial={{ rotate: -6, scale: 0.92, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} className="aspect-square w-full max-w-xs overflow-hidden rounded-3xl">
            <ProductArt art={p.art} color={hex} pattern={p.pattern} image={p.images[0]} className="h-full w-full" />
          </motion.div>
        </div>
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <div>
            <p className="text-xs font-medium tracking-widest text-brand uppercase">{p.category?.name}</p>
            <h3 className="mt-1 font-display text-2xl font-semibold">{p.name}</h3>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted">
              <Stars value={p.rating} /> {p.rating.toFixed(1)} · {p.reviewCount} reviews
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold">{inr(p.price)}</span>
              {p.mrp > p.price && (
                <>
                  <span className="text-sm text-muted line-through">{inr(p.mrp)}</span>
                  <span className="text-sm font-semibold text-emerald-600">{off(p.price, p.mrp)}% off</span>
                </>
              )}
            </div>
          </div>
          <ColorPicker colors={p.colors} value={color} onChange={setColor} />
          <ModelPicker models={p.models} value={model} onChange={setModel} />
          <div className="flex items-center gap-3">
            <Qty value={qty} onChange={setQty} max={Math.max(1, p.stock)} />
            <button onClick={submit} disabled={p.stock <= 0} className="btn-brand h-11 flex-1">
              {p.stock <= 0 ? 'Sold out' : 'Add to cart'}
            </button>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted">
            <Truck className="size-4 text-brand" /> Cash on Delivery · Free shipping above ₹999 · 7-day replacement
          </p>
          <Link href={`/product/${p.slug}`} onClick={onClose} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:gap-2 transition-all">
            View full details <ArrowRight className="size-4" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
