'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Smartphone } from 'lucide-react';
import { cn } from '@/lib/format';
import type { Color } from '@/lib/types';

export function ColorPicker({ colors, value, onChange }: { colors: Color[]; value?: string; onChange: (c: string) => void }) {
  if (!colors.length) return null;
  return (
    <div>
      <p className="label">
        Colour · <span className="text-ink normal-case">{value}</span>
      </p>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((c) => (
          <button
            key={c.name}
            type="button"
            title={c.name}
            aria-label={c.name}
            aria-pressed={value === c.name}
            onClick={() => onChange(c.name)}
            className="relative grid size-10 place-items-center rounded-full"
          >
            {value === c.name && <motion.span layoutId="color-ring" className="absolute inset-0 rounded-full ring-2 ring-brand" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
            <span className="size-7 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Phone-model chooser with grouping by brand + quick search when list is long. */
export function ModelPicker({ models, value, onChange }: { models: string[]; value?: string; onChange: (m: string) => void }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => models.filter((m) => m.toLowerCase().includes(q.toLowerCase())), [models, q]);
  if (!models.length) return null;
  return (
    <div>
      <p className="label flex items-center gap-1.5">
        <Smartphone className="size-3.5" /> Your phone model {!value && <span className="text-brand normal-case">· please select</span>}
      </p>
      {models.length > 8 && (
        <div className="relative mb-2">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search model, e.g. 16 Pro" className="input py-2 pl-9" />
        </div>
      )}
      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
        {list.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition',
              value === m ? 'border-brand bg-brand text-white shadow-[0_6px_14px_-6px_rgba(37,99,235,0.8)]' : 'border-line bg-white hover:border-brand/50',
            )}
          >
            {m}
          </button>
        ))}
        {!list.length && <p className="text-xs text-muted">No matching model.</p>}
      </div>
    </div>
  );
}
