'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

export const ease = [0.22, 1, 0.36, 1] as const;

/** Fades + lifts children into view on scroll. */
export function Reveal({ children, delay = 0, className, ...rest }: { children: ReactNode; delay?: number; className?: string } & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** "Shop Product by **Category**" style two-tone heading. */
export function Heading({ a, b, sub, className }: { a: string; b: string; sub?: string; className?: string }) {
  return (
    <div className={className}>
      <h2 className="font-display text-3xl leading-[1.05] font-semibold tracking-tight sm:text-4xl">
        {a} <span className="text-brand">{b}</span>
      </h2>
      {sub && <p className="mt-2 max-w-xl text-sm text-muted">{sub}</p>}
    </div>
  );
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200'} />
      ))}
    </span>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-brand-50 text-brand">{icon}</div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

export function Qty({ value, onChange, max = 99, small }: { value: number; onChange: (n: number) => void; max?: number; small?: boolean }) {
  return (
    <div className={cn('inline-flex items-center rounded-full border border-line bg-white', small ? 'h-8' : 'h-11')}>
      <button type="button" aria-label="Decrease" onClick={() => onChange(Math.max(1, value - 1))} className={cn('grid place-items-center rounded-full text-lg hover:bg-cream', small ? 'size-8' : 'size-11')}>
        −
      </button>
      <motion.span key={value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn('text-center font-medium tabular-nums', small ? 'w-6 text-sm' : 'w-8')}>
        {value}
      </motion.span>
      <button type="button" aria-label="Increase" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} className={cn('grid place-items-center rounded-full text-lg hover:bg-cream disabled:opacity-30', small ? 'size-8' : 'size-11')}>
        +
      </button>
    </div>
  );
}
