'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Banknote, Check, CreditCard, Lock, MapPin, ShoppingBag, Tag, User } from 'lucide-react';
import { ProductArt } from '@/components/ProductArt';
import { useAuth, useCart, useSettings, useToast } from '@/components/providers';
import { Empty } from '@/components/store/bits';
import { api } from '@/lib/api';
import { cn, inr, STATES } from '@/lib/format';


export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user, addresses } = useAuth();
  const settings = useSettings();
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', note: '' });
  const [hasPromo, setHasPromo] = useState(false);
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const onlineOn = settings.onlinePayments === 'true';
  const [method, setMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const a = addresses.find((x) => x.isDefault) || addresses[0];
    setForm((f) => ({
      ...f,
      name: f.name || a?.fullName || user.name,
      email: f.email || user.email,
      phone: f.phone || a?.phone || user.phone || '',
      ...(a && !f.line1 ? { line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode } : {}),
    }));
  }, [user, addresses]);

  // re-validate coupon if cart changes
  useEffect(() => {
    if (!coupon) return;
    api<{ discount: number; code: string }>('/coupons/validate', { body: { code: coupon.code, subtotal } })
      .then((r) => setCoupon({ code: r.code, discount: r.discount }))
      .catch(() => setCoupon(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const discount = coupon?.discount || 0;
  const shipping = subtotal - discount >= Number(settings.freeShippingAbove) ? 0 : Number(settings.shippingFee);
  const codFee = Number(settings.codFee) || 0;
  const total = subtotal - discount + shipping + codFee;

  const up = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let v = e.target.value;
    if (k === 'phone') v = v.replace(/\D/g, '').slice(0, 10);
    if (k === 'pincode') v = v.replace(/\D/g, '').slice(0, 6);
    setForm({ ...form, [k]: v });
    if (errors[k]) setErrors({ ...errors, [k]: '' });
  };

  const applyCoupon = async () => {
    try {
      const r = await api<{ discount: number; code: string }>('/coupons/validate', { body: { code, subtotal } });
      setCoupon({ code: r.code, discount: r.discount });
      toast(`Coupon ${r.code} applied — you save ${inr(r.discount)}`);
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (form.phone.length !== 10) e.phone = 'Enter a 10-digit mobile number';
    if (!form.line1.trim()) e.line1 = 'Enter house / street';
    if (!form.city.trim()) e.city = 'Enter city';
    if (!form.state) e.state = 'Choose state';
    if (form.pincode.length !== 6) e.pincode = '6-digit pincode';
    setErrors(e);
    if (Object.keys(e).length) document.getElementById(`f-${Object.keys(e)[0]}`)?.focus();
    return !Object.keys(e).length;
  };

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const r = await api<{ number: string; phone: string; payment?: GatewayInfo }>('/orders', {
        body: {
          customer: { name: form.name, email: form.email, phone: form.phone },
          address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
          items: items.map((i) => ({ productId: i.productId, qty: i.qty, model: i.model, color: i.color })),
          couponCode: coupon?.code,
          paymentMethod: method === 'ONLINE' && onlineOn ? 'ONLINE' : 'COD',
          note: form.note,
        },
      });
      sessionStorage.setItem(`kv_order_${r.number}`, r.phone);
      clear();
      if (r.payment) {
        // amount/order id come from OUR server; the browser only opens the checkout and passes back the signed result
        const paid = await payWithRazorpay(r.payment);
        if (paid) {
          await api('/payments/verify', { body: { number: r.number, ...paid } });
          router.push(`/order/${r.number}?new=1`);
        } else {
          toast('Payment was not completed. Your order is held for 30 minutes — you can choose Cash on Delivery by contacting us.', 'err');
          router.push(`/order/${r.number}`);
        }
        return;
      }
      router.push(`/order/${r.number}?new=1`);
    } catch (err) {
      toast((err as Error).message, 'err');
      setBusy(false);
    }
  };

  if (!items.length && !busy)
    return (
      <div className="container-x py-16">
        <Empty icon={<ShoppingBag className="size-7" />} title="Nothing to check out" text="Add something to your cart first." action={<Link href="/shop" className="btn-brand">Go shopping</Link>} />
      </div>
    );

  const F = ({ k, label, half, ...rest }: { k: keyof typeof form; label: string; half?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className={half ? '' : 'sm:col-span-2'}>
      <label htmlFor={`f-${k}`} className="label">
        {label}
      </label>
      <input id={`f-${k}`} value={form[k]} onChange={up(k)} className={cn('input', errors[k] && 'border-rose-400 ring-4 ring-rose-100')} {...rest} />
      {errors[k] && <p className="mt-1 text-xs text-rose-600">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={place} className="container-x py-10 sm:py-14" noValidate>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Checkout</h1>
        {!user && (
          <p className="text-sm text-muted">
            Have an account?{' '}
            <Link href="/account?next=/checkout" className="font-medium text-brand">
              Sign in
            </Link>{' '}
            for faster checkout.
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Section n={1} icon={<User className="size-4" />} title="Contact details">
            <div className="grid gap-4 sm:grid-cols-2">
              {F({ k: 'name', label: 'Full name', autoComplete: 'name' })}
              {F({ k: 'email', label: 'Email address', type: 'email', autoComplete: 'email', half: true })}
              {F({ k: 'phone', label: 'Mobile number', inputMode: 'numeric', autoComplete: 'tel', placeholder: '10-digit mobile', half: true })}
            </div>
          </Section>

          <Section n={2} icon={<MapPin className="size-4" />} title="Delivery address">
            {addresses.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {addresses.map((a) => {
                  const active = form.line1 === a.line1 && form.pincode === a.pincode;
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => setForm({ ...form, name: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode })}
                      className={cn('rounded-2xl border px-4 py-2 text-left text-xs transition', active ? 'border-brand bg-brand-50' : 'border-line hover:border-brand/40')}
                    >
                      <b className="block text-sm">{a.fullName}</b>
                      {a.line1}, {a.city} {a.pincode}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {F({ k: 'line1', label: 'House no., building, street', autoComplete: 'address-line1' })}
              {F({ k: 'line2', label: 'Area / landmark (optional)', autoComplete: 'address-line2' })}
              {F({ k: 'city', label: 'City', autoComplete: 'address-level2', half: true })}
              <div>
                <label htmlFor="f-state" className="label">
                  State
                </label>
                <select id="f-state" value={form.state} onChange={up('state')} className={cn('input', errors.state && 'border-rose-400')}>
                  <option value="">Select state</option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <p className="mt-1 text-xs text-rose-600">{errors.state}</p>}
              </div>
              {F({ k: 'pincode', label: 'Pincode', inputMode: 'numeric', autoComplete: 'postal-code', half: true })}
            </div>
          </Section>

          <Section n={3} icon={<Banknote className="size-4" />} title="Payment">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {[
                { k: 'COD' as const, icon: Banknote, t: 'Cash on Delivery', d: `Pay by cash or UPI to the delivery partner${codFee ? ` · ${inr(codFee)} COD fee` : ''}`, on: settings.codEnabled === 'true' },
                { k: 'ONLINE' as const, icon: CreditCard, t: 'UPI / Cards / Netbanking', d: onlineOn ? 'Secure payment by Razorpay' : 'Online payment is coming soon', on: onlineOn },
              ].map(({ k, icon: I, t, d, on }) => {
                const active = method === k && on;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    key={k}
                    disabled={!on}
                    onClick={() => setMethod(k)}
                    className={cn('relative rounded-2xl p-4 text-left transition', active ? 'border-2 border-brand bg-brand-50' : 'border border-line hover:border-brand/40', !on && 'cursor-not-allowed border-dashed opacity-60')}
                  >
                    {active && (
                      <motion.span layoutId="pay-check" className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-brand text-white">
                        <Check className="size-3" strokeWidth={3} />
                      </motion.span>
                    )}
                    {!on && <span className="absolute top-3 right-3 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">Soon</span>}
                    <I className={cn('size-6', active && 'text-brand')} />
                    <p className="mt-2 font-semibold">{t}</p>
                    <p className="text-xs text-muted">{d}</p>
                  </button>
                );
              })}
            </div>
            <textarea value={form.note} onChange={up('note')} rows={2} placeholder="Delivery instructions (optional)" className="input mt-4 resize-none" />
          </Section>
        </div>

        {/* summary */}
        <aside className="h-fit rounded-3xl bg-white p-6 lg:sticky lg:top-24">
          <p className="font-display text-xl font-semibold">Order summary</p>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.key} className="flex items-center gap-3">
                <span className="relative size-14 shrink-0 rounded-xl bg-cream-2 p-1.5">
                  <ProductArt art={i.art} color={i.colorHex} pattern={i.pattern} image={i.image} className="h-full w-full" />
                  <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-white">{i.qty}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{i.name}</span>
                  <span className="block truncate text-xs text-muted">{[i.model, i.color].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="text-sm font-semibold">{inr(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>

          <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm font-medium">
            <input type="checkbox" checked={hasPromo} onChange={(e) => setHasPromo(e.target.checked)} className="size-5 rounded accent-brand" />
            I have a promo code
          </label>
          <AnimatePresence>
            {hasPromo && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                {coupon ? (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                    <span className="flex items-center gap-2">
                      <Tag className="size-4" /> <b>{coupon.code}</b> applied
                    </span>
                    <button type="button" onClick={() => setCoupon(null)} className="text-xs underline">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" className="input py-2.5 uppercase" />
                    <button type="button" onClick={applyCoupon} disabled={!code} className="btn-dark shrink-0">
                      Apply
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{inr(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>Discount</dt>
                <dd>− {inr(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd>{shipping ? inr(shipping) : <span className="font-medium text-emerald-600">Free</span>}</dd>
            </div>
            {codFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">COD fee</dt>
                <dd>{inr(codFee)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-3 font-display text-xl font-semibold">
              <dt>Total</dt>
              <motion.dd key={total} initial={{ scale: 1.15, color: '#2563EB' }} animate={{ scale: 1, color: '#0F172A' }}>
                {inr(total)}
              </motion.dd>
            </div>
          </dl>
          <motion.button whileTap={{ scale: 0.98 }} disabled={busy} className="btn-brand mt-5 h-13 w-full py-3.5 text-base">
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Placing order…
              </span>
            ) : (
              <>Place order · {inr(total)}</>
            )}
          </motion.button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <Lock className="size-3.5" /> Your details are only used to deliver this order.
          </p>
        </aside>
      </div>
    </form>
  );
}

function Section({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.06 }} className="rounded-3xl bg-white p-6 sm:p-8">
      <h2 className="mb-5 flex items-center gap-3 font-display text-lg font-semibold">
        <span className="grid size-8 place-items-center rounded-full bg-brand text-sm text-white">{n}</span>
        {title}
        <span className="ml-auto text-muted">{icon}</span>
      </h2>
      {children}
    </motion.section>
  );
}

type GatewayInfo = { keyId: string; gatewayOrderId: string; amount: number; currency: string; name: string; prefill: Record<string, string> };
type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

/** Loads Razorpay Checkout on demand and resolves with the signed result (or null if the shopper closed it). */
function payWithRazorpay(p: GatewayInfo): Promise<RazorpayResult | null> {
  return new Promise((resolve, reject) => {
    const open = () => {
      const Rzp = (window as unknown as { Razorpay: new (o: object) => { open: () => void } }).Razorpay;
      new Rzp({
        key: p.keyId,
        order_id: p.gatewayOrderId,
        amount: p.amount,
        currency: p.currency,
        name: p.name,
        prefill: p.prefill,
        theme: { color: '#2563EB' },
        handler: (res: RazorpayResult) => resolve(res),
        modal: { ondismiss: () => resolve(null) },
      }).open();
    };
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return open();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = open;
    s.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'));
    document.body.appendChild(s);
  });
}
