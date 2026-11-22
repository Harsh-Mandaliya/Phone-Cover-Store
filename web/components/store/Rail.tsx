'use client';

import { useRef, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

/** Horizontal snap carousel with the outlined/filled arrow pair from the reference design. */
export function Rail({ children, head, itemClass = 'w-[72%] sm:w-[44%] lg:w-[23.5%]' }: { children: ReactNode[]; head?: ReactNode; itemClass?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        {head}
        <div className="flex shrink-0 gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => go(-1)} aria-label="Previous" className="grid h-9 w-14 place-items-center rounded-full border border-brand text-brand transition hover:bg-brand-50">
            <ArrowLeft className="size-4" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => go(1)} aria-label="Next" className="grid h-9 w-14 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-600">
            <ArrowRight className="size-4" />
          </motion.button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-6 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {children.map((c, i) => (
          <div key={i} className={`shrink-0 snap-start ${itemClass}`}>
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
