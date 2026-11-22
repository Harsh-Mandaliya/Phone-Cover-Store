'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { ProductArt } from '@/components/ProductArt';
import { useCart, useSettings } from '@/components/providers';
import { inr } from '@/lib/format';
import { Qty } from './bits';

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const s = useSettings();
  const goal = Number(s.freeShippingAbove) || 999;
  const pct = Math.min(100, (subtotal / goal) * 100);
  const left = goal - subtotal;
  return (
    <div className="rounded-2xl bg-cream p-3.5">
      <p className="flex items-center gap-2 text-xs font-medium">
        <Truck className="size-4 text-brand" />
        {left > 0 ? (
          <span>
            Add <b>{inr(left)}</b> more for <b>FREE shipping</b>
          </span>
        ) : (
          <span>You&apos;ve unlocked FREE shipping 🎉</span>
        )}
      </p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white">
        <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { open, setOpen, items, subtotal, setQty, remove, count } = useCart();
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.aside
            role="dialog"
            aria-label="Shopping cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-xl font-semibold">
                Your Cart <span className="text-muted">({count})</span>
              </h2>
              <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-cream" aria-label="Close cart">
                <X className="size-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <motion.div initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="grid size-20 place-items-center rounded-full bg-brand-50 text-brand">
                  <ShoppingBag className="size-9" />
                </motion.div>
                <p className="font-display text-lg font-semibold">Your cart is empty</p>
                <p className="text-sm text-muted">Find a case that fits your phone and your style.</p>
                <Link href="/shop" onClick={() => setOpen(false)} className="btn-brand">
                  Start shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="px-5 pt-4">
                  <FreeShippingBar subtotal={subtotal} />
                </div>
                <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  <AnimatePresence initial={false}>
                    {items.map((i) => (
                      <motion.li key={i.key} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }} className="flex gap-3 rounded-2xl border border-line p-2.5">
                        <Link href={`/product/${i.slug}`} onClick={() => setOpen(false)} className="grid size-20 shrink-0 place-items-center rounded-xl bg-cream-2 p-2">
                          <ProductArt art={i.art} color={i.colorHex} pattern={i.pattern} image={i.image} className="h-full w-full" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex justify-between gap-2">
                            <p className="line-clamp-1 text-sm font-semibold">{i.name}</p>
                            <button onClick={() => remove(i.key)} aria-label="Remove" className="text-muted hover:text-rose-600">
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <p className="text-xs text-muted">{[i.model, i.color].filter(Boolean).join(' · ')}</p>
                          <div className="mt-auto flex items-center justify-between pt-1.5">
                            <Qty small value={i.qty} max={i.stock} onChange={(n) => setQty(i.key, n)} />
                            <span className="font-display font-semibold">{inr(i.price * i.qty)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="space-y-3 border-t border-line p-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-display text-lg font-semibold">{inr(subtotal)}</span>
                  </div>
                  <p className="text-xs text-muted">Shipping and coupons are applied at checkout.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/cart" onClick={() => setOpen(false)} className="btn-line">
                      View cart
                    </Link>
                    <Link href="/checkout" onClick={() => setOpen(false)} className="btn-brand">
                      Checkout
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
