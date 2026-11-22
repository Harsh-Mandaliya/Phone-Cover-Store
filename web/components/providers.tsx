'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api, TOKEN_KEY } from '@/lib/api';
import type { Address, Product, Settings, User } from '@/lib/types';

/* ============ Toasts ============ */
type Toast = { id: number; text: string; kind: 'ok' | 'err' };
const ToastCtx = createContext<(text: string, kind?: 'ok' | 'err') => void>(() => {});
export const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setList((l) => [...l.slice(-2), { id, text, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 print:hidden">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-2xl"
            >
              {t.kind === 'ok' ? <CheckCircle2 className="size-5 shrink-0 text-brand" /> : <AlertCircle className="size-5 shrink-0 text-rose-400" />}
              <span>{t.text}</span>
              <button onClick={() => setList((l) => l.filter((x) => x.id !== t.id))} aria-label="Dismiss" className="ml-1 opacity-60 hover:opacity-100">
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ============ Auth ============ */
type AuthState = {
  user: User | null;
  addresses: Address[];
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
};
const AuthCtx = createContext<AuthState>(null as unknown as AuthState);
export const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const r = await api<{ user: User; addresses: Address[] }>('/auth/me');
      setUser(r.user);
      setAddresses(r.addresses);
    } catch (e) {
      if ((e as { status?: number }).status === 401) localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const done = async (r: { token: string; user: User }) => {
    localStorage.setItem(TOKEN_KEY, r.token);
    setUser(r.user);
    await refresh();
    return r.user;
  };
  const value: AuthState = {
    user,
    addresses,
    ready,
    refresh,
    login: async (email, password) => done(await api('/auth/login', { body: { email, password } })),
    register: async (data) => done(await api('/auth/register', { body: data })),
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setAddresses([]);
    },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

/* ============ Cart ============ */
export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  mrp: number;
  art: string;
  pattern: string;
  colorHex: string;
  color?: string;
  model?: string;
  image?: string;
  stock: number;
  qty: number;
};
type CartState = {
  items: CartItem[];
  saved: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (o: boolean) => void;
  add: (p: Product, opts?: { qty?: number; model?: string; color?: string; silent?: boolean }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  saveForLater: (key: string) => void;
  moveToCart: (key: string) => void;
  clear: () => void;
};
const CartCtx = createContext<CartState>(null as unknown as CartState);
export const useCart = () => useContext(CartCtx);

const CART_KEY = 'kv_cart';
function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [saved, setSaved] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
      setItems(raw.items || []);
      setSaved(raw.saved || []);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify({ items, saved }));
    } catch {
      /* ignore */
    }
  }, [items, saved, loaded]);

  const add: CartState['add'] = (p, opts = {}) => {
    const color = p.colors.find((c) => c.name === opts.color) || p.colors[0];
    const model = opts.model || (p.models.length === 1 ? p.models[0] : undefined);
    const key = [p.id, model, color?.name].join('|');
    const qty = opts.qty || 1;
    setItems((list) => {
      const found = list.find((i) => i.key === key);
      if (found) return list.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, p.stock) } : i));
      return [
        ...list,
        { key, productId: p.id, slug: p.slug, name: p.name, price: p.price, mrp: p.mrp, art: p.art, pattern: p.pattern, colorHex: color?.hex || '#222', color: color?.name, model, image: p.images[0], stock: p.stock, qty: Math.min(qty, p.stock) },
      ];
    });
    if (!opts.silent) {
      toast(`Added to cart — ${p.name}${model ? ` · ${model}` : ''}`);
      setOpen(true);
    }
  };

  const value: CartState = useMemo(
    () => ({
      items,
      saved,
      open,
      setOpen,
      add,
      count: items.reduce((a, i) => a + i.qty, 0),
      subtotal: items.reduce((a, i) => a + i.qty * i.price, 0),
      setQty: (key, qty) => setItems((l) => l.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, i.stock || 99)) } : i))),
      remove: (key) => setItems((l) => l.filter((i) => i.key !== key)),
      saveForLater: (key) => {
        const it = items.find((i) => i.key === key);
        if (!it) return;
        setItems((l) => l.filter((i) => i.key !== key));
        setSaved((s) => [...s.filter((i) => i.key !== key), it]);
      },
      moveToCart: (key) => {
        const it = saved.find((i) => i.key === key);
        if (!it) return;
        setSaved((s) => s.filter((i) => i.key !== key));
        setItems((l) => [...l.filter((i) => i.key !== key), it]);
      },
      clear: () => setItems([]),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, saved, open],
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

/* ============ Store settings ============ */
const FALLBACK: Settings = {
  storeName: 'All Is Well',
  supportEmail: 'support@alliswell.local',
  supportPhone: '+91 98765 43210',
  address: '',
  shippingFee: '79',
  freeShippingAbove: '999',
  codEnabled: 'true',
  codFee: '0',
  announcement: 'Free shipping on orders above ₹999 · Cash on Delivery available',
};
const SettingsCtx = createContext<Settings>(FALLBACK);
export const useSettings = () => useContext(SettingsCtx);
function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState(FALLBACK);
  useEffect(() => {
    api<Settings>('/settings').then(setS).catch(() => {});
  }, []);
  return <SettingsCtx.Provider value={s}>{children}</SettingsCtx.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
