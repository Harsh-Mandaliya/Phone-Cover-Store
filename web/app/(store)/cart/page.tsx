'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
import { ProductArt } from '@/components/ProductArt';
import { useCart } from '@/components/providers';
import { FreeShippingBar } from '@/components/store/CartDrawer';
import { Empty, Qty } from '@/components/store/bits';
import { inr } from '@/lib/format';

export default function CartPage() {
  const { items, saved, subtotal, count, setQty, remove, saveForLater, moveToCart } = useCart();
  const savings = items.reduce((a, i) => a + Math.max(0, i.mrp - i.price) * i.qty, 0);

  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Shopping Cart</h1>
      {items.length === 0 && saved.length === 0 ? (
        <div className="mt-8">
          <Empty icon={<ShoppingBag className="size-7" />} title="Your cart is empty" text="Looks like you haven’t added anything yet." action={<Link href="/shop" className="btn-brand">Continue shopping</Link>} />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="rounded-3xl bg-white p-5 sm:p-8">
            <div className="flex justify-between border-b border-line pb-3 text-sm text-muted">
              <span>{count} items</span>
              <span>Price</span>
            </div>
            <ul>
              <AnimatePresence initial={false}>
                {items.map((i) => (
                  <motion.li key={i.key} layout exit={{ opacity: 0, height: 0 }} className="flex gap-4 border-b border-line py-6 sm:gap-6">
                    <Link href={`/product/${i.slug}`} className="grid size-24 shrink-0 place-items-center rounded-2xl bg-cream-2 p-2 sm:size-32">
                      <ProductArt art={i.art} color={i.colorHex} pattern={i.pattern} image={i.image} className="h-full w-full" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex justify-between gap-4">
                        <Link href={`/product/${i.slug}`} className="font-display font-semibold tracking-wide uppercase hover:text-brand">
                          {i.name}
                        </Link>
                        <span className="shrink-0 font-display font-semibold">{inr(i.price * i.qty)}</span>
                      </div>
                      {i.stock <= 5 && <p className="text-xs text-rose-600">Only {i.stock} left in stock — order soon.</p>}
                      <p className="text-xs text-muted">{inr(i.price) + ' each'}{i.mrp > i.price && <span className="ml-1 line-through">{inr(i.mrp)}</span>}</p>
                      {i.model && <p className="text-sm">Model: {i.model}</p>}
                      {i.color && <p className="text-sm">Colour: {i.color}</p>}
                      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm">
                        <Qty small value={i.qty} max={i.stock} onChange={(n) => setQty(i.key, n)} />
                        <button onClick={() => remove(i.key)} className="text-teal hover:underline">Delete</button>
                        <span className="h-4 w-px bg-line" />
                        <button onClick={() => saveForLater(i.key)} className="text-teal hover:underline">Save for later</button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="flex flex-col-reverse items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
              <Link href="/shop" className="btn-line">
                <ChevronLeft className="size-4" /> Continue shopping
              </Link>
              <p className="text-lg">
                Subtotal ({count} items): <b className="font-display">{inr(subtotal)}</b>
              </p>
            </div>

            {saved.length > 0 && (
              <div className="mt-10">
                <p className="font-display text-lg font-semibold">Saved for later ({saved.length})</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {saved.map((i) => (
                    <div key={i.key} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                      <span className="size-16 shrink-0 rounded-xl bg-cream-2 p-1.5">
                        <ProductArt art={i.art} color={i.colorHex} pattern={i.pattern} image={i.image} className="h-full w-full" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{i.name}</p>
                        <p className="text-xs text-muted">{inr(i.price)}</p>
                      </div>
                      <button onClick={() => moveToCart(i.key)} className="btn-ghost px-3 py-1.5 text-xs">
                        Move to cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <aside className="h-fit space-y-4 rounded-3xl bg-white p-6 lg:sticky lg:top-24">
              <p className="font-display text-xl font-semibold">Order Summary</p>
              <FreeShippingBar subtotal={subtotal} />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd>{inr(subtotal)}</dd>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <dt>You save</dt>
                    <dd>{inr(savings)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping & coupons</dt>
                  <dd className="text-muted">at checkout</dd>
                </div>
              </dl>
              <Link href="/checkout" className="btn-brand h-12 w-full text-base">
                Proceed to checkout
              </Link>
              <p className="text-center text-xs text-muted">Cash on Delivery available</p>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
