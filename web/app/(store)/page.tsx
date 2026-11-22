'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUpRight, BadgeCheck, PlayCircle, RefreshCcw, ShieldCheck, Smartphone, Truck, Wallet } from 'lucide-react';
import { ProductArt } from '@/components/ProductArt';
import { Photo } from '@/components/Photo';
import { MEDIA } from '@/lib/media';
import { ProductCard, ProductSkeleton } from '@/components/store/ProductCard';
import { Rail } from '@/components/store/Rail';
import { Heading, Reveal, Stars, ease } from '@/components/store/bits';
import { api } from '@/lib/api';
import { cn } from '@/lib/format';
import type { Category, Product, Review } from '@/lib/types';

const useList = (q: string) => {
  const [list, setList] = useState<Product[] | null>(null);
  useEffect(() => {
    api<{ products: Product[] }>(`/products?${q}`)
      .then((r) => setList(r.products))
      .catch(() => setList([]));
  }, [q]);
  return list;
};

export default function HomePage() {
  const trending = useList('flag=trending&limit=10');
  const featured = useList('flag=featured&limit=8');
  const fresh = useList('flag=new&sort=newest&limit=10');
  const [cats, setCats] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    api<Category[]>('/categories').then(setCats).catch(() => {});
    api<Review[]>('/reviews/top').then(setReviews).catch(() => {});
    api<{ models: string[] }>('/filters').then((r) => setModels(r.models)).catch(() => {});
  }, []);

  return (
    <>
      <Hero />
      <TrustStrip />

      {/* Trending */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-x grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.6fr)]">
          <Reveal className="relative flex min-h-64 flex-col overflow-hidden rounded-3xl bg-brand p-7 text-white sm:p-9">
            <div className="absolute -right-16 -bottom-16 size-56 rounded-full bg-white/10" />
            <div className="absolute -top-10 -right-6 size-32 rounded-full bg-white/10" />
            <h2 className="relative font-display text-4xl leading-[1.05] font-semibold">
              Our Trending
              <br /> Products
            </h2>
            <p className="relative mt-4 max-w-xs text-sm text-white/85">Transform your everyday mobile moments with accessories our customers can&apos;t stop ordering.</p>
            <Link href="/shop?flag=trending" className="group relative mt-auto ml-auto grid size-12 place-items-center rounded-full bg-white/15 transition hover:bg-white hover:text-brand" aria-label="See all trending">
              <ArrowUpRight className="size-6 transition group-hover:rotate-45" />
            </Link>
          </Reveal>
          <div className="min-w-0">
            <Rail itemClass="w-[72%] sm:w-[46%] lg:w-[31.5%]" head={<span className="text-sm text-muted">Hand-picked bestsellers this week</span>}>
              {(trending || Array.from({ length: 4 }, () => null)).map((p, i) => (p ? <ProductCard key={p.id} p={p} /> : <ProductSkeleton key={i} />))}
            </Rail>
          </div>
        </div>
      </section>

      {/* Categories bento */}
      <section id="categories" className="scroll-mt-24 bg-cream py-16 sm:py-20">
        <div className="container-x">
          <div className="mb-10 flex items-end justify-between gap-4">
            <Reveal>
              <Heading a="Shop Product by" b="Category" sub="Everything your phone, watch and earbuds need — organised so you find it in seconds." />
            </Reveal>
            <Link href="/shop" className="btn-brand hidden sm:inline-flex">
              View All
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cats.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.06} className={cn(i === 0 && 'sm:col-span-2 lg:row-span-2', (i === 3 || (i === 6 && cats.length === 7)) && 'lg:col-span-2')}>
                <Link
                  href={`/shop?category=${c.slug}`}
                  className={cn(
                    'group relative flex h-full overflow-hidden rounded-3xl bg-ink p-6 text-white transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] sm:p-8',
                    i === 0 ? 'min-h-80 lg:min-h-[480px]' : 'min-h-56',
                    'flex-col justify-end',
                  )}
                >
                  {c.image ? (
                    <Photo src={c.image} alt={c.name} className="absolute inset-0 h-full w-full transition-transform duration-[1.2s] group-hover:scale-110" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center bg-cream p-10">
                      <ProductArt art={c.art} color={c.color} className="h-full w-full" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/85" />
                  <div className="relative z-10">
                    <span className="mb-2 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] backdrop-blur">{c.count} products</span>
                    <h3 className={cn('font-display leading-tight font-semibold', i === 0 ? 'text-3xl sm:text-4xl' : 'text-xl')}>{c.name}</h3>
                    <p className={cn('mt-1 text-sm text-white/75', i !== 0 && 'line-clamp-1')}>{c.tagline}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-medium text-white transition-all group-hover:gap-2.5 group-hover:pr-4">
                      Shop Now <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-16 sm:py-20">
        <div className="container-x">
          <div className="mb-8 flex items-end justify-between">
            <Reveal>
              <Heading a="Featured" b="Products" />
            </Reveal>
            <Link href="/shop?flag=featured" className="group flex items-center gap-1 text-sm font-medium text-brand">
              See all <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {(featured || Array.from({ length: 8 }, () => null)).map((p, i) =>
              p ? (
                <Reveal key={p.id} delay={(i % 4) * 0.06}>
                  <ProductCard p={p} />
                </Reveal>
              ) : (
                <ProductSkeleton key={i} />
              ),
            )}
          </div>
        </div>
      </section>

      {/* Find your phone */}
      <FindPhone models={models} />

      {/* Protection banner */}
      <ProtectionBanner />

      {/* New arrivals */}
      <section className="py-16 sm:py-20">
        <div className="container-x">
          <Rail head={<Heading a="New" b="Arrival" />}>{(fresh || Array.from({ length: 4 }, () => null)).map((p, i) => (p ? <ProductCard key={p.id} p={p} /> : <ProductSkeleton key={i} />))}</Rail>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="bg-cream py-16 sm:py-20">
          <div className="container-x">
            <Rail head={<Heading a="Our Clients" b="Reviews" sub="Real words from real customers across India." />} itemClass="w-[85%] sm:w-[48%] lg:w-[32%]">
              {reviews.map((r) => (
                <motion.figure key={r.id} whileHover={{ y: -4 }} className="flex h-full flex-col rounded-3xl bg-white p-6">
                  <Stars value={r.rating} />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">&ldquo;{r.comment}&rdquo;</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-brand to-amber-400 font-display font-semibold text-white">{r.name[0]}</span>
                    <span>
                      <span className="block text-sm font-semibold">{r.name}</span>
                      {r.product && (
                        <Link href={`/product/${r.product.slug}`} className="block text-xs text-muted hover:text-brand">
                          Bought {r.product.name}
                        </Link>
                      )}
                    </span>
                    <BadgeCheck className="ml-auto size-5 text-emerald-500" aria-label="Verified buyer" />
                  </figcaption>
                </motion.figure>
              ))}
            </Rail>
          </div>
        </section>
      )}
    </>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 15 });
  const sy = useSpring(my, { stiffness: 60, damping: 15 });
  const rX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const rY = useTransform(sx, [-0.5, 0.5], [-8, 8]);
  const shift = useTransform(sx, [-0.5, 0.5], [-14, 14]);

  const words = ['Armour', 'Your'];
  return (
    <section
      className="relative overflow-hidden bg-cream"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      <div className="container-x grid items-center gap-10 pt-10 pb-16 lg:grid-cols-2 lg:pt-16 lg:pb-24">
        <div className="relative z-10">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium">
            <span className="size-2 animate-pulse rounded-full bg-brand" /> New iPhone 17 collection is live
          </motion.span>
          <h1 className="mt-5 font-display text-5xl leading-[0.98] font-semibold tracking-tight sm:text-6xl xl:text-7xl">
            {words.map((w, i) => (
              <motion.span key={w} className="mr-3 inline-block" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 + i * 0.08, ease }}>
                {w}
              </motion.span>
            ))}
            <br />
            <motion.span className="mr-3 inline-block text-brand" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease }}>
              Phone
            </motion.span>
            <motion.span className="inline-block" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.38, ease }}>
              in Style
            </motion.span>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-6 max-w-md text-base leading-relaxed text-ink/70">
            Premium cases, glass and accessories that turn everyday phone moments into something special — delivered to your door with Cash on Delivery.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/shop" className="btn-brand group h-12 px-6 text-base">
              Shop Now <PlayCircle className="size-5 transition group-hover:rotate-90" />
            </Link>
            <Link href="#categories" className="btn-line h-12 px-6 text-base">
              Explore categories
            </Link>
          </motion.div>
          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              ['50K+', 'Happy customers'],
              ['4.9★', 'Average rating'],
              ['2,000+', 'Pin codes served'],
            ].map(([a, b]) => (
              <div key={b}>
                <dt className="font-display text-2xl font-semibold">{a}</dt>
                <dd className="text-xs text-muted">{b}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* visual */}
        <motion.div style={{ rotateX: rX, rotateY: rY }} className="relative mx-auto aspect-square w-full max-w-[560px] [perspective:1000px]">
          {/* arch-shaped photo frame (reference: R&Z hero) */}
          <motion.div
            initial={{ clipPath: 'inset(100% 0% 0% 0% round 999px 999px 40px 40px)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 999px 999px 40px 40px)' }}
            transition={{ duration: 1.2, ease }}
            className="absolute inset-y-[2%] right-[4%] left-[12%] overflow-hidden bg-brand"
          >
            <motion.div style={{ x: shift }} initial={{ scale: 1.25 }} animate={{ scale: 1.1 }} transition={{ duration: 1.8, ease }} className="absolute inset-0">
              <Photo eager src={MEDIA.hero} alt="Smiling woman using her phone" className="h-full w-full object-[50%_30%]" />
            </motion.div>
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand/50 to-transparent" />
          </motion.div>
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }} className="absolute top-[6%] left-[4%] size-16 rounded-full border-2 border-dashed border-brand/50" />

          {/* floating real product */}
          <motion.div initial={{ opacity: 0, x: 40, rotate: 8 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ delay: 0.75, ease, duration: 0.9 }} className="absolute top-[30%] -right-[2%] w-28 sm:w-40">
            <div className="animate-float rounded-3xl bg-white p-2 shadow-2xl" style={{ ['--r' as string]: '4deg' }}>
              <Photo eager src={MEDIA.heroProduct} alt="Armour Pro MagSafe Case" className="aspect-square w-full rounded-2xl" />
              <p className="px-1.5 pt-2 text-xs font-semibold">Armour Pro Case</p>
              <p className="px-1.5 pb-1 text-xs font-semibold text-brand">₹1,299</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9, ease }} className="absolute bottom-[10%] left-0 rounded-2xl bg-white p-4 shadow-xl sm:left-[-4%]">
            <p className="text-sm font-semibold">Our Reviews</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex -space-x-2">
                {['#2563EB', '#24324F', '#9DB39A', '#E09F3E'].map((c, i) => (
                  <span key={i} className="grid size-8 place-items-center rounded-full border-2 border-white text-xs font-semibold text-white" style={{ background: c }}>
                    {'ARPK'[i]}
                  </span>
                ))}
              </div>
              <span className="font-display font-semibold">+ 12K</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.05, ease }} className="absolute top-[10%] right-[6%] flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-medium text-white shadow-xl">
            <ShieldCheck className="size-4 text-brand" /> 12 ft drop tested
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, ease }} className="absolute right-[10%] bottom-[6%] hidden rounded-2xl sm:block bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
            <p className="text-[11px] text-muted">Starting at</p>
            <p className="font-display text-xl font-semibold text-brand">₹399</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { i: Truck, t: 'Free shipping', s: 'On orders above ₹999' },
    { i: Wallet, t: 'Cash on Delivery', s: 'Pay when it arrives' },
    { i: RefreshCcw, t: '7-day replacement', s: 'Easy, no questions' },
    { i: ShieldCheck, t: 'Quality checked', s: 'Every order, by hand' },
  ];
  return (
    <section className="border-y border-line bg-white">
      <div className="container-x grid grid-cols-2 gap-px py-2 lg:grid-cols-4">
        {items.map(({ i: I, t, s }, k) => (
          <Reveal key={t} delay={k * 0.05} className="flex items-center gap-3 px-2 py-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand">
              <I className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{t}</span>
              <span className="block text-xs text-muted">{s}</span>
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FindPhone({ models }: { models: string[] }) {
  const groups = [
    { label: 'iPhone', match: (m: string) => m.startsWith('iPhone') },
    { label: 'Samsung', match: (m: string) => m.startsWith('Galaxy') },
    { label: 'Watch & AirPods', match: (m: string) => m.startsWith('Apple') || m.startsWith('AirPods') },
  ];
  const [tab, setTab] = useState(0);
  const list = models.filter(groups[tab].match);
  return (
    <section className="py-6">
      <div className="container-x">
        <Reveal className="overflow-hidden rounded-[2rem] bg-ink p-7 text-white sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-brand uppercase">
                <Smartphone className="size-4" /> Find my fit
              </span>
              <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Shop for your exact device</h2>
              <p className="mt-2 max-w-md text-sm text-white/60">Pick your model and we&apos;ll only show accessories that fit perfectly.</p>
            </div>
            <div className="flex gap-1 rounded-full bg-white/10 p-1">
              {groups.map((g, i) => (
                <button key={g.label} onClick={() => setTab(i)} className="relative rounded-full px-4 py-2 text-sm">
                  {tab === i && <motion.span layoutId="fit-tab" className="absolute inset-0 rounded-full bg-brand" />}
                  <span className="relative">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex flex-wrap gap-2">
            {list.map((m) => (
              <Link key={m} href={`/shop?model=${encodeURIComponent(m)}`} className="rounded-full border border-white/15 px-4 py-2 text-sm transition hover:border-brand hover:bg-brand">
                {m}
              </Link>
            ))}
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

function ProtectionBanner() {
  return (
    <section className="pt-16">
      <div className="container-x">
        <Reveal className="relative grid overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand to-[#60A5FA] md:grid-cols-2">
          <div className="relative z-10 p-8 text-white sm:p-12">
            <p className="text-xs font-semibold tracking-widest uppercase opacity-80">Built to survive</p>
            <h2 className="mt-3 font-display text-4xl leading-tight font-semibold sm:text-5xl">Experience Unbeatable Protection</h2>
            <p className="mt-4 max-w-sm text-white/85">Raised camera lips, air-cushion corners and 9H glass — tested drop after drop so your phone doesn&apos;t have to be.</p>
            <Link href="/shop?category=iphone-cases" className="btn mt-8 bg-white text-brand hover:bg-cream">
              Shop protection <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="relative min-h-80 overflow-hidden">
            <motion.div className="absolute inset-0" initial={{ scale: 1.2 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease }}>
              <Photo src={MEDIA.protection} alt="Hand holding a phone" className="h-full w-full" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-r from-brand via-brand/20 to-transparent max-md:bg-gradient-to-b" />
            {[
              ['12 ft', 'drop tested'],
              ['9H', 'glass hardness'],
              ['1.5 mm', 'raised lip'],
            ].map(([a, b], i) => (
              <motion.div
                key={b}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="absolute right-5 rounded-2xl bg-white/90 px-4 py-2.5 shadow-xl backdrop-blur"
                style={{ top: `${18 + i * 24}%` }}
              >
                <p className="font-display text-lg leading-none font-semibold text-brand">{a}</p>
                <p className="text-[11px] text-muted">{b}</p>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
