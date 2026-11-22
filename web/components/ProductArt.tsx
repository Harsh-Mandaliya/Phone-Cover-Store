'use client';

import { useId } from 'react';
import { assetUrl } from '@/lib/api';

/** Shade a hex colour: amt < 0 darkens, > 0 lightens. */
function shade(hex: string, amt: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
}
const isLight = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 > 170;
};

type Props = { art: string; color: string; pattern?: string; image?: string | null; className?: string; title?: string };

/** Product visual: uploaded photo if available, otherwise a crafted SVG illustration in the product colour. */
export function ProductArt({ art, color, pattern = 'solid', image, className = '', title }: Props) {
  const raw = useId();
  const id = raw.replace(/[^a-zA-Z0-9]/g, '');
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={assetUrl(image)} alt={title || ''} className={`h-full w-full rounded-[inherit] object-cover ${className}`} loading="lazy" />;
  }
  const c = color || '#222';
  const dark = shade(c, -0.35);
  const light = shade(c, 0.35);
  const ink = isLight(c) ? '#1d1d1d' : '#ffffff';
  const clear = pattern === 'clear';
  const body = clear ? 'rgba(220,232,240,0.55)' : `url(#g${id})`;

  const defs = (
    <defs>
      <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={light} />
        <stop offset="0.55" stopColor={c} />
        <stop offset="1" stopColor={dark} />
      </linearGradient>
      <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`sh${id}`}>
        <stop offset="0" stopColor="#000" stopOpacity="0.22" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <pattern id={`d${id}`} width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="1.6" fill={ink} fillOpacity="0.16" />
      </pattern>
      <pattern id={`l${id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
        <rect width="8" height="3" fill={ink} fillOpacity="0.09" />
      </pattern>
    </defs>
  );

  const texture = (x: number, y: number, w: number, h: number, rx: number) => (
    <>
      {pattern === 'dots' && <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#d${id})`} />}
      {pattern === 'stripes' && <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#l${id})`} />}
      {pattern === 'marble' && (
        <g stroke={ink} strokeOpacity="0.18" fill="none" strokeWidth="1.4">
          <path d={`M${x} ${y + h * 0.3} C ${x + w * 0.4} ${y + h * 0.2}, ${x + w * 0.5} ${y + h * 0.55}, ${x + w} ${y + h * 0.45}`} />
          <path d={`M${x} ${y + h * 0.7} C ${x + w * 0.3} ${y + h * 0.6}, ${x + w * 0.7} ${y + h * 0.85}, ${x + w} ${y + h * 0.75}`} />
          <path d={`M${x + w * 0.2} ${y} C ${x + w * 0.3} ${y + h * 0.3}, ${x + w * 0.1} ${y + h * 0.5}, ${x + w * 0.35} ${y + h}`} strokeOpacity="0.1" />
        </g>
      )}
    </>
  );

  let shape: React.ReactNode;
  switch (art) {
    case 'watch':
      shape = (
        <g>
          <rect x="78" y="8" width="44" height="184" rx="14" fill={body} />
          {texture(78, 8, 44, 184, 14)}
          <rect x="60" y="58" width="80" height="88" rx="22" fill="#2a2a2a" />
          <rect x="66" y="64" width="68" height="76" rx="17" fill="#0b0b0b" />
          <text x="100" y="102" textAnchor="middle" fill="#2563EB" fontSize="17" fontWeight="700" fontFamily="system-ui">10:09</text>
          <rect x="80" y="112" width="40" height="5" rx="2.5" fill="#3ddc84" opacity="0.8" />
          <rect x="80" y="121" width="26" height="5" rx="2.5" fill="#4aa3ff" opacity="0.8" />
          <rect x="140" y="84" width="7" height="18" rx="3" fill="#555" />
          <rect x="70" y="68" width="30" height="5" rx="2.5" fill={`url(#s${id})`} />
        </g>
      );
      break;
    case 'airpods':
      shape = (
        <g>
          <path d="M150 82 C 182 70, 186 120, 160 128" stroke="#2b2b2b" strokeWidth="5" fill="none" strokeLinecap="round" />
          <rect x="42" y="58" width="116" height="96" rx="42" fill={body} />
          {texture(42, 58, 116, 96, 42)}
          <path d="M44 92 H156" stroke={dark} strokeOpacity="0.5" strokeWidth="2" />
          <circle cx="100" cy="118" r="3" fill="#3ddc84" />
          <rect x="60" y="64" width="60" height="7" rx="3.5" fill={`url(#s${id})`} />
        </g>
      );
      break;
    case 'protector':
      shape = (
        <g transform="rotate(-10 100 100)">
          <rect x="58" y="14" width="88" height="172" rx="20" fill="#cfe0ea" fillOpacity={pattern === 'solid' ? 0.2 : 0.5} stroke="#9fb6c4" strokeWidth="2" />
          {pattern === 'solid' && <rect x="58" y="14" width="88" height="172" rx="20" fill="#111" fillOpacity="0.55" />}
          <rect x="88" y="22" width="28" height="8" rx="4" fill="#9fb6c4" fillOpacity="0.6" />
          <path d="M70 160 L130 40" stroke="#fff" strokeOpacity="0.8" strokeWidth="10" strokeLinecap="round" />
          <path d="M92 170 L136 82" stroke="#fff" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
      break;
    case 'charger':
      shape = (
        <g>
          <path d="M100 150 C 100 175, 140 170, 150 196" stroke={shade(c, -0.1)} strokeWidth="7" fill="none" strokeLinecap="round" />
          <circle cx="100" cy="95" r="62" fill={body} />
          {pattern === 'stripes' ? <rect x="52" y="60" width="96" height="70" rx="14" fill={`url(#l${id})`} /> : null}
          <circle cx="100" cy="95" r="44" fill="none" stroke={ink} strokeOpacity="0.18" strokeWidth="3" />
          <circle cx="100" cy="95" r="10" fill={ink} fillOpacity="0.12" />
          <path d="M60 70 A 48 48 0 0 1 110 46" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      );
      break;
    case 'powerbank':
      shape = (
        <g>
          <rect x="52" y="28" width="96" height="150" rx="20" fill={body} />
          {texture(52, 28, 96, 150, 20)}
          <circle cx="100" cy="92" r="30" fill="none" stroke={ink} strokeOpacity="0.15" strokeWidth="3" />
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={85 + i * 10} cy="160" r="3" fill={i < 3 ? '#3ddc84' : ink} fillOpacity={i < 3 ? 1 : 0.2} />
          ))}
          <rect x="88" y="174" width="24" height="5" rx="2.5" fill={dark} />
          <rect x="60" y="36" width="10" height="120" rx="5" fill={`url(#s${id})`} />
        </g>
      );
      break;
    case 'cable':
      shape = (
        <g fill="none" strokeLinecap="round">
          <path d="M40 60 C 40 20, 160 20, 150 70 C 140 120, 50 90, 60 140 C 70 180, 150 170, 160 150" stroke={c} strokeWidth="9" />
          <path d="M40 60 C 40 20, 160 20, 150 70 C 140 120, 50 90, 60 140 C 70 180, 150 170, 160 150" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="4 6" />
          <rect x="30" y="58" width="20" height="34" rx="6" fill="#e9e9e9" stroke="#bbb" />
          <rect x="154" y="140" width="34" height="20" rx="6" fill="#e9e9e9" stroke="#bbb" transform="rotate(-20 170 150)" />
        </g>
      );
      break;
    default: // phone case
      shape = (
        <g>
          <rect x="52" y="10" width="96" height="182" rx="22" fill={body} stroke={clear ? '#a9bccb' : 'none'} strokeWidth="2" />
          {texture(52, 10, 96, 182, 22)}
          {clear && <rect x="58" y="16" width="84" height="170" rx="18" fill="#c9b7a8" fillOpacity="0.45" />}
          <rect x="60" y="20" width="48" height="50" rx="14" fill={clear ? '#9aa8b3' : dark} fillOpacity={clear ? 0.6 : 0.9} />
          {[
            [73, 34],
            [95, 34],
            [73, 56],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="8.5" fill="#1a1a1a" stroke={shade(c, -0.55)} strokeWidth="2" />
              <circle cx={x - 2} cy={y - 2} r="2.4" fill="#5b6b8a" />
            </g>
          ))}
          <circle cx="96" cy="57" r="3" fill="#fff6cf" />
          {(pattern === 'magsafe' || clear) && <circle cx="100" cy="112" r="28" fill="none" stroke={clear ? '#8d9aa5' : ink} strokeOpacity={clear ? 0.8 : 0.2} strokeWidth="3" />}
          {pattern === 'magsafe' && <rect x="97" y="142" width="6" height="16" rx="3" fill={ink} fillOpacity="0.2" />}
          <rect x="146" y="58" width="4" height="22" rx="2" fill={dark} />
          <rect x="60" y="80" width="9" height="100" rx="4.5" fill={`url(#s${id})`} />
        </g>
      );
  }

  return (
    <svg viewBox="0 0 200 210" className={className} role="img" aria-label={title || 'Product illustration'}>
      {defs}
      <ellipse cx="100" cy="200" rx="58" ry="7" fill={`url(#sh${id})`} />
      {shape}
    </svg>
  );
}
