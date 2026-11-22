'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, MapPin, PackageCheck, RefreshCcw, ShieldCheck, Star, Truck, Wallet } from 'lucide-react';
import { ProductArt } from '@/components/ProductArt';
import { Photo } from '@/components/Photo';
import { useAuth, useCart, useToast } from '@/components/providers';
import { ProductCard } from '@/components/store/ProductCard';
import { ColorPicker, ModelPicker } from '@/components/store/pickers';
import { Empty, Heading, Qty, Reveal, Stars } from '@/components/store/bits';
import { api } from '@/lib/api';
import { cn, date, deliveryEta, inr, off } from '@/lib/format';
import type { Product, Review } from '@/lib/types';

type Data = { product: Product; reviews: Review[]; related: Product[] };

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  const load = () =>
    api<Data>(`/products/${slug}`)
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (error)
    return (
      <div className="container-x py-20">
        <Empty icon={<PackageCheck className="size-7" />} title="Product not found" text={error} action={<Link href="/shop" className="btn-brand">Back to shop</Link>} />
      </div>
    );
  if (!data)
    return (
      <div className="container-x grid gap-10 py-12 lg:grid-cols-2">
        <div className="skeleton aspect-square rounded-3xl" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-5 w-1/3" />
          <div className="skeleton h-24" />
          <div className="skeleton h-12 w-1/2" />
        </div>
      </div>
    );
  return <Detail key={data.product.id} {...data} reload={load} />;
}

function Detail({ product: p, reviews, related, reload }: Data & { reload: () => void }) {
  const { add } = useCart();
  const toast = useToast();
  const router = useRouter();
  const [color, setColor] = useState(p.colors[0]?.name);
  const [model, setModel] = useState<string | undefined>(p.models.length === 1 ? p.models[0] : undefined);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [tab, setTab] = useState<'details' | 'reviews'>('details');
  const [pin, setPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const hex = p.colors.find((c) => c.name === color)?.hex || '#222';
  const discount = off(p.price, p.mrp);
  const out = p.stock <= 0;

  // gallery: uploaded photos first, then one illustration per colour
  const gallery: { image?: string; hex: string; name?: string }[] = [...p.images.map((image) => ({ image, hex })), ...(p.images.length ? [] : p.colors.map((c) => ({ hex: c.hex, name: c.name })))];
  const current = gallery[img] || { hex };

  const go = (buy: boolean) => {
    if (p.models.length && !model) {
      toast('Please choose your phone model first.', 'err');
      document.getElementById('model-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    add(p, { color, model, qty, silent: buy });
    if (buy) router.push('/checkout');
  };

  return (
    <div className="container-x py-8 sm:py-12">
      <nav className="text-xs text-muted">
        <Link href="/" className="hover:text-brand">Home</Link> / <Link href={`/shop?category=${p.category?.slug}`} className="hover:text-brand">{p.category?.name}</Link> / <span className="text-ink">{p.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        {/* gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative grid aspect-square place-items-center overflow-hidden rounded-[2rem] bg-cream">
            <div className="absolute inset-[15%] rounded-full blur-3xl" style={{ background: hex, opacity: 0.2 }} />
            <AnimatePresence mode="wait">
              <motion.div
                key={`${img}-${current.hex}`}
                initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                className={current.image ? 'group/zoom absolute inset-0 overflow-hidden' : 'relative h-[78%] w-[78%]'}
              >
                {current.image ? (
                  <Photo eager src={current.image} alt={p.name} className="h-full w-full transition-transform duration-700 group-hover/zoom:scale-125" />
                ) : (
                  <ProductArt art={p.art} color={current.hex} pattern={p.pattern} title={p.name} className="h-full w-full drop-shadow-2xl" />
                )}
              </motion.div>
            </AnimatePresence>
            {discount > 0 && <span className="absolute top-5 left-5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">Save {discount}%</span>}
          </div>
          {gallery.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setImg(i);
                    if (g.name) setColor(g.name);
                  }}
                  className={cn('grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream transition', !g.image && 'p-2', img === i ? 'ring-2 ring-brand' : 'opacity-70 hover:opacity-100')}
                  aria-label={g.name || `Image ${i + 1}`}
                >
                  <ProductArt art={p.art} color={g.hex} pattern={p.pattern} image={g.image} className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div>
          <p className="text-xs font-semibold tracking-widest text-brand uppercase">{p.category?.name}</p>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{p.name}</h1>
          <p className="mt-1 text-xs text-muted">SKU: {p.sku}</p>
          <button onClick={() => { setTab('reviews'); document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-3 flex items-center gap-2 text-sm">
            <Stars value={p.rating} /> <span className="font-medium">{p.rating.toFixed(1)}</span> <span className="text-muted underline-offset-2 hover:underline">({p.reviewCount} reviews)</span>
          </button>

          <div className="mt-5 flex items-end gap-3">
            <span className="font-display text-4xl font-semibold">{inr(p.price)}</span>
            {discount > 0 && (
              <>
                <span className="pb-1 text-muted line-through">{inr(p.mrp)}</span>
                <span className="mb-1 rounded-full bg-emerald-50 px-2 py-0.5 text-sm font-semibold text-emerald-700">{discount}% off</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>

          <p className="mt-5 leading-relaxed text-ink/75">{p.description}</p>

          <div className="mt-7 space-y-6 rounded-3xl bg-white p-5 sm:p-6">
            <ColorPicker colors={p.colors} value={color} onChange={(c) => { setColor(c); setImg(p.images.length ? img : p.colors.findIndex((x) => x.name === c)); }} />
            <div id="model-picker">
              <ModelPicker models={p.models} value={model} onChange={setModel} />
            </div>
            <div>
              <p className={cn('mb-2 text-sm font-medium', out ? 'text-rose-600' : p.stock <= p.lowStockAt ? 'text-amber-600' : 'text-emerald-600')}>
                {out ? 'Currently sold out' : p.stock <= p.lowStockAt ? `Hurry — only ${p.stock} left in stock` : 'In stock, ready to ship'}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Qty value={qty} onChange={setQty} max={Math.max(1, p.stock)} />
                <button disabled={out} onClick={() => go(false)} className="btn-brand h-12 min-w-40 flex-1 text-base">
                  Add to cart
                </button>
                <button disabled={out} onClick={() => go(true)} className="btn-dark h-12 min-w-32 flex-1 text-base">
                  Buy now
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-line p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="size-4 text-brand" /> Check delivery
            </p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setPinMsg(/^\d{6}$/.test(pin) ? `Delivers by ${deliveryEta()} · Cash on Delivery available` : 'Please enter a valid 6-digit pincode.');
              }}
            >
              <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="Enter pincode" className="input py-2.5" />
              <button className="btn-line shrink-0">Check</button>
            </form>
            <AnimatePresence>
              {pinMsg && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 text-sm text-ink/80">
                  {pinMsg}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              {[
                [Truck, 'Free shipping ₹999+'],
                [Wallet, 'Cash on Delivery'],
                [RefreshCcw, '7-day replacement'],
                [ShieldCheck, 'Quality checked'],
              ].map(([I, t], i) => {
                const Icon = I as typeof Truck;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 rounded-2xl bg-cream-2 p-3 text-center">
                    <Icon className="size-5 text-brand" />
                    {t as string}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div id="tabs" className="mt-16 scroll-mt-24">
        <div className="flex gap-6 border-b border-line">
          {(['details', 'reviews'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('relative pb-3 font-display text-lg capitalize', tab === t ? 'font-semibold' : 'text-muted')}>
              {t === 'reviews' ? `Reviews (${reviews.length})` : 'Details'}
              {tab === t && <motion.span layoutId="tab-u" className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-8">
            {tab === 'details' ? (
              <div className="grid gap-8 md:grid-cols-2">
                <p className="leading-relaxed text-ink/75">{p.description}</p>
                <dl className="overflow-hidden rounded-2xl border border-line text-sm">
                  {[
                    ['Category', p.category?.name],
                    ['SKU', p.sku],
                    ['Colours', p.colors.map((c) => c.name).join(', ')],
                    ['Compatible with', p.models.length ? p.models.join(', ') : 'Universal'],
                    ['In the box', '1 × product, care card'],
                  ].map(([k, v], i) => (
                    <div key={k} className={cn('grid grid-cols-[140px_1fr] gap-4 px-4 py-3', i % 2 === 0 && 'bg-cream-2')}>
                      <dt className="text-muted">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <Reviews productId={p.id} reviews={reviews} onDone={reload} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <Reveal>
            <Heading a="You may also" b="like" className="mb-6" />
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Reviews({ productId, reviews, onDone }: { productId: string; reviews: Review[]; onDone: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', rating: 5, comment: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ pending: boolean }>(`/products/${productId}/reviews`, { body: form });
      toast(r.pending ? 'Thanks! Your review will appear after a quick check.' : 'Thanks for your review!');
      setForm({ name: '', rating: 5, comment: '' });
      onDone();
    } catch (err) {
      toast((err as Error).message, 'err');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <ul className="space-y-4">
        {reviews.length === 0 && <p className="text-muted">No reviews yet — be the first!</p>}
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-brand-50 font-semibold text-brand">{r.name[0]}</span>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {r.name} {r.verified && <span className="inline-flex items-center gap-0.5 text-xs font-normal text-emerald-600"><BadgeCheck className="size-4" /> Verified buyer</span>}
                </p>
                <p className="text-xs text-muted">{date(r.createdAt)}</p>
              </div>
              <Stars value={r.rating} className="ml-auto" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">{r.comment}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="h-fit space-y-4 rounded-3xl bg-white p-6">
        <p className="font-display text-lg font-semibold">Write a review</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.button whileTap={{ scale: 0.8 }} type="button" key={n} onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} stars`}>
              <Star className={cn('size-7 transition', n <= form.rating ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200')} />
            </motion.button>
          ))}
        </div>
        {!user && <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="input" />}
        <textarea required value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="How do you like it?" rows={4} className="input resize-none" />
        <button disabled={busy} className="btn-brand w-full">
          {busy ? 'Posting…' : 'Post review'}
        </button>
      </form>
    </div>
  );
}
