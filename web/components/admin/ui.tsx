'use client';

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/format';

export function PageCard({ title, sub, actions, children }: { title: string; sub?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{title}</h1>
          {sub && <p className="text-sm text-zinc-500">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </motion.div>
  );
}

const TONES = {
  teal: 'bg-[#DBEAFE]',
  yellow: 'bg-[#E0E7FF]',
  green: 'bg-[#E0F2FE]',
  pink: 'bg-[#E2E8F0]',
  orange: 'bg-brand-100',
  violet: 'bg-[#E2E8F0]',
};
export function StatCard({ icon, label, value, tone = 'teal', hint, onClick, active }: { icon: ReactNode; label: string; value: ReactNode; tone?: keyof typeof TONES; hint?: string; onClick?: () => void; active?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      className={cn('flex items-center gap-4 rounded-2xl p-5 text-left transition', TONES[tone], onClick ? 'cursor-pointer' : 'cursor-default', active && 'ring-2 ring-brand ring-offset-2')}
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-zinc-700">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-700">{label}</span>
        <span className="block font-display text-2xl font-semibold">{value}</span>
        {hint && <span className="block text-xs text-zinc-600">{hint}</span>}
      </span>
    </motion.button>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <label className={cn('relative block', className)}>
      <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-full border border-zinc-200 bg-white py-2.5 pr-4 pl-10 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
    </label>
  );
}

export function Pill({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand">
      <option value="">{label}</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

export function StockBadge({ stock, low }: { stock: number; low: number }) {
  if (stock <= 0) return <span className="rounded-md bg-rose-600 px-2 py-0.5 text-xs font-medium text-white">Out of Stock</span>;
  if (stock <= low) return <span className="rounded-md bg-amber-400 px-2 py-0.5 text-xs font-medium text-zinc-900">Low Stock</span>;
  return <span className="rounded-md bg-lime-100 px-2 py-0.5 text-xs font-medium text-lime-800 ring-1 ring-lime-300">Available</span>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-brand' : 'bg-zinc-300')}>
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow', checked ? 'right-0.5' : 'left-0.5')} />
    </button>
  );
}

export function Drawer({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] print:static" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] print:hidden" onClick={onClose} />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className={cn('absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl', wide ? 'max-w-3xl' : 'max-w-xl')}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 print:hidden">
              <h2 className="font-display text-lg font-semibold">{title}</h2>
              <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-zinc-100" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4 print:hidden">{footer}</div>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold text-zinc-600">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
export const ainput = 'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10';
export const abtn = 'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-50';
export const abtnTeal = `${abtn} bg-brand text-white hover:bg-brand-600`;
export const abtnLine = `${abtn} border border-zinc-200 bg-white hover:border-zinc-400`;

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="-mx-5 overflow-x-auto sm:-mx-6">{children}</div>;
}
export const th = 'whitespace-nowrap bg-zinc-50 px-4 py-3 text-left text-sm font-semibold text-zinc-800 first:pl-6 last:pr-6';
export const td = 'whitespace-nowrap px-4 py-3.5 text-sm text-zinc-700 first:pl-6 last:pr-6';

export function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="py-16 text-center text-sm text-zinc-400">
        {text}
      </td>
    </tr>
  );
}
