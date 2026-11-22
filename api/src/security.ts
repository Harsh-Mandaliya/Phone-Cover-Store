import type { NextFunction, Request, Response } from 'express';

/* ---------- rate limiting (in-memory, per IP + optional key) ----------
 * Good for a single server. If you later run several API instances, move the
 * counters to Redis (e.g. Upstash free tier) — the interface stays the same. */
type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
}, 60_000).unref();

export function rateLimit(opts: { name: string; max: number; windowMs: number; key?: (req: Request) => string; message?: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = `${opts.name}:${req.ip}:${opts.key ? opts.key(req) : ''}`;
    const now = Date.now();
    let b = buckets.get(id);
    if (!b || b.reset < now) {
      b = { count: 0, reset: now + opts.windowMs };
      buckets.set(id, b);
    }
    b.count++;
    res.setHeader('RateLimit-Remaining', Math.max(0, opts.max - b.count));
    if (b.count > opts.max) {
      res.setHeader('Retry-After', Math.ceil((b.reset - now) / 1000));
      return res.status(429).json({ error: opts.message || 'Too many attempts. Please wait a few minutes and try again.' });
    }
    next();
  };
}
export const resetRateLimits = () => buckets.clear();

/* ---------- security headers (helmet-style, no dependency) ---------- */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // images are used by the web app on another port
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; frame-ancestors 'none'");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

/* ---------- output encoding ---------- */
export const escapeHtml = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Stops "CSV injection": spreadsheet apps run cells starting with = + - @ as formulas. */
export const csvCell = (v: unknown) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

/* ---------- input cleaning ---------- */
/** Trim, drop control characters and angle brackets, cap length. Use for names, addresses, notes. */
export const cleanText = (v: unknown, max = 120) =>
  (typeof v === 'string' ? v : '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]/g, '')
    .trim()
    .slice(0, max);
