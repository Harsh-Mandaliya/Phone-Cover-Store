'use client';

import { motion } from 'framer-motion';
import { Check, ExternalLink, PackageCheck, Truck } from 'lucide-react';
import { ProductArt } from '@/components/ProductArt';
import { cn, date, FLOW, inr, STATUS } from '@/lib/format';
import type { Order } from '@/lib/types';

export function StatusBadge({ status }: { status: Order['status'] }) {
  const s = STATUS[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1', s.tone)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

/** Horizontal progress (Walmart-style) + timeline. */
export function OrderTracker({ order, compact }: { order: Order; compact?: boolean }) {
  const cancelled = order.status === 'CANCELLED' || order.status === 'RETURNED';
  const idx = FLOW.indexOf(order.status);
  const pct = cancelled ? 0 : (idx / (FLOW.length - 1)) * 100;
  const when = (s: string) => order.events?.find((e) => e.status === s)?.createdAt;
  const trackUrl = order.partner?.trackingUrl && order.trackingNumber ? order.partner.trackingUrl.replace('{tracking}', order.trackingNumber) : '';

  if (order.status === 'PENDING_PAYMENT')
    return (
      <div className="rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
        We&apos;re waiting for your online payment. Unpaid orders are released after 30 minutes. Nothing is charged twice, and if money left your account we&apos;ll refund it.
      </div>
    );
  if (cancelled)
    return (
      <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
        This order was {STATUS[order.status].label.toLowerCase()}
        {when(order.status) ? ` on ${date(when(order.status)!)}` : ''}. Any stock has been released.
      </div>
    );

  return (
    <div>
      <div className="relative mx-3 mt-2 mb-10 sm:mx-6">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-line" />
        <motion.div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
        <div className="relative flex justify-between">
          {FLOW.map((s, i) => {
            const done = i <= idx;
            return (
              <div key={s} className="relative flex flex-col items-center">
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: i === idx ? [1, 1.25, 1] : 1 }}
                  transition={{ delay: 0.15 * i, duration: 0.5 }}
                  className={cn('z-10 grid size-6 place-items-center rounded-full border-2 transition-colors', done ? 'border-brand bg-brand text-white' : 'border-line bg-white')}
                >
                  {done && <Check className="size-3.5" strokeWidth={3} />}
                </motion.span>
                {!compact && <span className={cn('absolute top-8 w-20 text-center text-[11px] leading-tight', i === idx ? 'font-semibold text-ink' : 'text-muted', 'max-sm:hidden')}>{STATUS[s].label}</span>}
              </div>
            );
          })}
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <Truck className="size-4 text-brand" />
        <b>{STATUS[order.status].label}</b>
        {order.partner?.name && <span className="text-muted">via {order.partner.name}</span>}
        {order.trackingNumber && <span className="text-muted">· AWB {order.trackingNumber}</span>}
        {trackUrl && (
          <a href={trackUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand underline-offset-2 hover:underline">
            Track package <ExternalLink className="size-3.5" />
          </a>
        )}
      </p>
      {!compact && order.events && (
        <ol className="mt-6 space-y-4 border-l-2 border-dashed border-line pl-5">
          {[...order.events].reverse().map((e, i) => (
            <motion.li key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative">
              <span className={cn('absolute top-1 -left-[27px] size-3 rounded-full ring-4 ring-white', i === 0 ? 'bg-brand' : 'bg-zinc-300')} />
              <p className="text-sm font-medium">{STATUS[e.status].label}</p>
              <p className="text-xs text-muted">
                {date(e.createdAt, true)}
                {e.note ? ` · ${e.note}` : ''}
              </p>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function OrderLines({ order }: { order: Order }) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 py-3">
            <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-cream-2 p-1.5">
              <ProductArt art={i.art} color={i.colorHex} pattern={i.pattern} image={i.image} className="h-full w-full" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{i.name}</p>
              <p className="text-xs text-muted">{[i.model, i.color, `Qty ${i.qty}`].filter(Boolean).join(' · ')}</p>
            </div>
            <span className="text-sm font-semibold">{inr(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
        <Row k="Subtotal" v={inr(order.subtotal)} />
        {order.discount > 0 && <Row k={`Discount ${order.couponCode ? `(${order.couponCode})` : ''}`} v={`− ${inr(order.discount)}`} green />}
        <Row k="Shipping" v={order.shipping ? inr(order.shipping) : 'Free'} />
        {order.codFee > 0 && <Row k="COD fee" v={inr(order.codFee)} />}
        <div className="flex justify-between pt-2 font-display text-lg font-semibold">
          <dt>Total</dt>
          <dd>{inr(order.total)}</dd>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <PackageCheck className="size-3.5" /> {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod} · {order.paymentStatus === 'PAID' ? 'Paid' : 'Payment pending'}
        </p>
      </dl>
    </div>
  );
}

const Row = ({ k, v, green }: { k: string; v: string; green?: boolean }) => (
  <div className="flex justify-between">
    <dt className="text-muted">{k}</dt>
    <dd className={green ? 'font-medium text-emerald-600' : ''}>{v}</dd>
  </div>
);
