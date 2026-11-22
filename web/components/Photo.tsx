'use client';

import { useState } from 'react';
import { assetUrl } from '@/lib/api';
import { cn } from '@/lib/format';

/** Real product/lifestyle photo: shimmer placeholder → soft fade + de-blur when loaded. */
export function Photo({ src, alt, className, eager, sizes = 'w' }: { src: string; alt: string; className?: string; eager?: boolean; sizes?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={cn('grid place-items-center bg-cream text-xs text-muted', className)}>Image unavailable</div>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={assetUrl(src)}
      alt={alt}
      data-sizes={sizes}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      ref={(el) => {
        if (el?.complete && el.naturalWidth) setLoaded(true);
      }}
      className={cn('object-cover transition-[opacity,filter,transform] duration-700 ease-out', loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md', className)}
    />
  );
}
