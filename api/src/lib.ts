import { PrismaClient, type Coupon, type Product } from '@prisma/client';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';

export const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || '';
if (JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be set to a random string of at least 32 characters.');
  console.warn('⚠  JWT_SECRET is short/missing — fine for local dev, NOT for production.');
}
const SECRET = JWT_SECRET || 'local-dev-only-secret-change-me-please';

/* ---------- errors ---------- */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};

/* ---------- auth ---------- */
export type AuthUser = { id: string; role: string; email: string; name: string };
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const signToken = (u: AuthUser) => jwt.sign({ id: u.id, role: u.role, email: u.email, name: u.name }, SECRET, { algorithm: 'HS256', expiresIn: '7d' });

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) {
    try {
      const p = jwt.verify(h.slice(7), SECRET, { algorithms: ['HS256'] }) as AuthUser;
      req.user = { id: p.id, role: p.role, email: p.email, name: p.name };
    } catch {
      /* invalid token = guest */
    }
  }
  next();
}
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });
    next();
  });
}
/** Admin check re-reads the role from the database, so a removed or demoted admin loses access immediately
 *  (the role inside an old token is never trusted on its own). */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, async () => {
    try {
      const u = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { role: true } });
      if (u?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access only.' });
      next();
    } catch (e) {
      next(e);
    }
  });
}
export const publicUser = (u: { id: string; name: string; email: string; phone: string | null; role: string; createdAt: Date }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  createdAt: u.createdAt,
});

/* ---------- helpers ---------- */
const parse = <T>(s: string, d: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return d;
  }
};
export const toProduct = (p: Product & { category?: { name: string; slug: string } | null }) => ({
  ...p,
  models: parse<string[]>(p.models, []),
  colors: parse<{ name: string; hex: string }[]>(p.colors, []),
  images: parse<string[]>(p.images, []),
});

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
export const int = (v: unknown, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : d;
};

export const ORDER_STATUSES = ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'] as const;

/* ---------- store settings (key/value with defaults) ---------- */
export const DEFAULT_SETTINGS = {
  storeName: 'All Is Well',
  supportEmail: 'support@alliswell.local',
  supportPhone: '+91 98765 43210',
  address: 'Shop 12, Gaffar Market, Karol Bagh, New Delhi 110005',
  shippingFee: '79',
  freeShippingAbove: '999',
  codEnabled: 'true',
  codFee: '0',
  announcement: 'Free shipping on orders above ₹999 · Cash on Delivery available',
};
export type Settings = typeof DEFAULT_SETTINGS;
export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const s = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in s) (s as Record<string, string>)[r.key] = r.value;
  return s;
}

/* ---------- pricing ---------- */
export async function couponDiscount(code: string | undefined, subtotal: number) {
  if (!code) return { discount: 0, coupon: null as null | Coupon };
  const c = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!c || !c.active) fail(400, 'This coupon code is not valid.');
  if (c!.expiresAt && c!.expiresAt < new Date()) fail(400, 'This coupon has expired.');
  if (c!.usageLimit && c!.usedCount >= c!.usageLimit) fail(400, 'This coupon has reached its usage limit.');
  if (subtotal < c!.minOrder) fail(400, `Add ₹${c!.minOrder - subtotal} more to use ${c!.code}.`);
  let d = c!.type === 'PERCENT' ? Math.round((subtotal * c!.value) / 100) : c!.value;
  if (c!.maxDiscount) d = Math.min(d, c!.maxDiscount);
  return { discount: Math.min(d, subtotal), coupon: c! };
}

/* ---------- email (free, local): saved as HTML files in api/mail-outbox ---------- */
const OUTBOX = path.join(__dirname, '..', 'mail-outbox');
export function sendMail(to: string, subject: string, html: string) {
  try {
    fs.mkdirSync(OUTBOX, { recursive: true });
    const file = path.join(OUTBOX, `${Date.now()}-${slugify(subject).slice(0, 40)}.html`);
    // subject/recipient can contain customer input → strip markup; callers escape the html body
    fs.writeFileSync(file, `<!-- to: ${to.replace(/[^\w@.+-]/g, '')} -->\n<h2>${subject.replace(/[<>&"']/g, '')}</h2>\n${html}`);
    console.log(`✉  mail → ${to} | ${subject}`);
  } catch (e) {
    console.error('mail failed', e);
  }
}
