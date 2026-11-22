'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, ShoppingBag, Star } from 'lucide-react';
import { ProductArt } from '@/components/ProductArt';
import { Photo } from '@/components/Photo';
import { useCart } from '@/components/providers';
import { cn, inr, off } from '@/lib/format';
import type { Product } from '@/lib/types';

import { QuickView } from './QuickView';

export function ProductCard({ p, compact }: { p: Product; compact?: boolean }) {
  const { add } = useCart();
  const [quick, setQuick] = useState(false);
  const [hoverColor, setHoverColor] = useState(0);
  const discount = off(p.price, p.mrp);
  const out = p.stock <= 0;
  const needsChoice = p.models.length > 1;
  const color = p.colors[hoverColor] || p.colors[0];

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="group relative flex h-full flex-col rounded-3xl border border-transparent bg-white p-3 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors hover:border-brand/60 hover:shadow-[0_24px_40px_-24px_rgba(37,99,235,0.45)]"
      >
        <Link href={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-2xl bg-cream-2">
          {p.images[0] ? (
            <>
              <Photo src={p.images[0]} alt={p.name} className="absolute inset-0 h-full w-full group-hover:scale-[1.06]" />
              {/* second photo crossfades in on hover, like real fashion/tech stores */}
              {p.images[1] && <Photo src={p.images[1]} alt="" className="absolute inset-0 h-full w-full opacity-0! group-hover:opacity-100! group-hover:scale-[1.06]" />}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 grid place-items-center p-6 transition-transform duration-500 group-hover:scale-[1.07] group-hover:-rotate-2">
              <ProductArt art={p.art} color={color?.hex} pattern={p.pattern} title={p.name} className="h-full w-full" />
            </div>
          )}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {discount > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">-{discount}%</span>}
            {p.isNew && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">New</span>}
          </div>
          {out && <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/90 py-1 text-center text-xs font-semibold text-muted backdrop-blur">Sold out</span>}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setQuick(true);
            }}
            aria-label="Quick view"
            className="absolute top-2.5 right-2.5 grid size-9 translate-y-1 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Eye className="size-4" />
          </button>
        </Link>

        <div className="flex flex-1 flex-col px-1 pt-3">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/product/${p.slug}`} className="line-clamp-1 font-display text-[15px] font-semibold hover:text-brand">
              {p.name}
            </Link>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {p.rating.toFixed(1)}
            </span>
          </div>
          {!compact && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted/80">{p.models.length ? `Fits ${p.models.slice(0, 3).join(', ')}${p.models.length > 3 ? ` +${p.models.length - 3}` : ''}` : p.description}</p>}

          {p.colors.length > 1 && (
            <div className="mt-2 flex gap-1.5">
              {p.colors.slice(0, 5).map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  onMouseEnter={() => setHoverColor(i)}
                  onClick={() => setHoverColor(i)}
                  className={cn('size-4 rounded-full ring-1 ring-black/10 ring-offset-2 transition', i === hoverColor && 'ring-2 ring-brand')}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <div className="leading-tight">
              <div className="font-display text-lg font-semibold">{inr(p.price)}</div>
              {discount > 0 && <div className="text-xs text-muted line-through">{inr(p.mrp)}</div>}
            </div>
            <button
              type="button"
              disabled={out}
              onClick={() => (needsChoice ? setQuick(true) : add(p, { color: color?.name }))}
              className="btn-brand px-4 py-2 text-xs sm:text-sm"
            >
              <ShoppingBag className="size-4" />
              {out ? 'Sold out' : needsChoice ? 'Choose' : 'Add'}
            </button>
          </div>
        </div>
      </motion.article>
      <QuickView product={quick ? p : null} onClose={() => setQuick(false)} />
    </>
  );
}

export function ProductSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-3">
      <div className="skeleton aspect-square" />
      <div className="skeleton mt-3 h-4 w-3/4" />
      <div className="skeleton mt-2 h-3 w-1/2" />
      <div className="mt-4 flex justify-between">
        <div className="skeleton h-6 w-16" />
        <div className="skeleton h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}
