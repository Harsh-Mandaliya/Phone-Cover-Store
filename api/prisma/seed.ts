/* Seeds a realistic demo store. Run: npm run db:setup (or db:reset to wipe + reseed).
 * Demo logins (local only — change them in production):
 *   Admin:    admin@alliswell.local / Admin@123
 *   Customer: riya@example.com   / customer123
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATEGORY_PHOTOS, PRODUCT_PHOTOS } from './photos';

const prisma = new PrismaClient();
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const IP17 = ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17', 'iPhone Air'];
const IP16 = ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 16 Plus'];
const IP15 = ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15'];
const SAM = ['Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25', 'Galaxy S24 Ultra', 'Galaxy S24'];
const FOLD = ['Galaxy Z Fold 7', 'Galaxy Z Flip 7'];
const WATCH = ['Apple Watch 41mm', 'Apple Watch 45mm', 'Apple Watch Ultra 49mm'];
const PODS = ['AirPods Pro 2', 'AirPods 4'];

const C = {
  black: { name: 'Midnight Black', hex: '#1E1E1E' },
  orange: { name: 'Sunset Orange', hex: '#F15A24' },
  sand: { name: 'Desert Sand', hex: '#D9C2A7' },
  sage: { name: 'Sage Green', hex: '#9DB39A' },
  navy: { name: 'Deep Navy', hex: '#24324F' },
  lilac: { name: 'Lilac', hex: '#B9A6D9' },
  pink: { name: 'Blush Pink', hex: '#E8B4B8' },
  clear: { name: 'Crystal Clear', hex: '#DDE6EE' },
  white: { name: 'Cloud White', hex: '#F1F1EE' },
  blue: { name: 'Ocean Blue', hex: '#2F7FD1' },
  titan: { name: 'Natural Titanium', hex: '#A8A39A' },
  red: { name: 'Cherry Red', hex: '#B3262E' },
};

type P = {
  name: string;
  cat: string;
  price: number;
  mrp: number;
  stock: number;
  colors: { name: string; hex: string }[];
  models?: string[];
  pattern?: string;
  f?: boolean;
  n?: boolean;
  t?: boolean;
  desc: string;
};

const products: P[] = [
  // iPhone cases
  { name: 'Armour Pro MagSafe Case', cat: 'iphone-cases', price: 1299, mrp: 1999, stock: 48, colors: [C.black, C.orange, C.sand, C.navy], models: [...IP17, ...IP16], pattern: 'magsafe', f: true, t: true, desc: 'Military-grade 12 ft drop protection with a built-in N52 magnet ring. Raised camera lip, tactile metal buttons and a soft-touch matte finish that never feels slippery.' },
  { name: 'Crystal Clear MagSafe Case', cat: 'iphone-cases', price: 899, mrp: 1499, stock: 64, colors: [C.clear], models: [...IP17, ...IP16, ...IP15], pattern: 'clear', t: true, desc: 'Anti-yellowing crystal clear back that shows off your iPhone colour. Shock-absorbing corners and full MagSafe compatibility.' },
  { name: 'Silicone Soft Touch Case', cat: 'iphone-cases', price: 799, mrp: 1199, stock: 4, colors: [C.sage, C.lilac, C.pink, C.black, C.navy], models: [...IP17, ...IP16], pattern: 'solid', f: true, desc: 'Liquid silicone outside, microfibre lining inside. Silky grip in five calm colours, with MagSafe magnets built in.' },
  { name: 'Marble Luxe Glass Case', cat: 'iphone-cases', price: 999, mrp: 1599, stock: 22, colors: [C.white, C.black], models: [...IP16, ...IP15], pattern: 'marble', n: true, desc: 'Tempered glass back with a hand-finished marble print and a flexible TPU frame. Looks premium, protects every corner.' },
  { name: 'Leather Folio Wallet Case', cat: 'iphone-cases', price: 1599, mrp: 2499, stock: 15, colors: [C.sand, C.black, C.red], models: [...IP17, ...IP16], pattern: 'stripes', f: true, desc: 'Vegan leather folio with three card slots, a cash pocket and a stand mode for videos. Magnetic closure keeps it shut.' },
  { name: 'Titan Rugged Armour Case', cat: 'iphone-cases', price: 1499, mrp: 2299, stock: 0, colors: [C.black, C.titan], models: [...IP17], pattern: 'stripes', n: true, desc: 'Dual-layer rugged armour with a built-in kickstand ring and 15 ft drop rating. Made for travel and the outdoors.' },
  { name: 'Dot Grid Matte Case', cat: 'iphone-cases', price: 699, mrp: 999, stock: 38, colors: [C.orange, C.white, C.navy], models: [...IP17, ...IP16, ...IP15], pattern: 'dots', n: true, t: true, desc: 'Featherweight matte case with a playful dot-grid texture. Fingerprint resistant and just 1.2 mm thin.' },
  // Samsung cases
  { name: 'Galaxy Armour Pro Case', cat: 'samsung-cases', price: 1199, mrp: 1899, stock: 30, colors: [C.black, C.navy, C.titan], models: SAM, pattern: 'magsafe', f: true, t: true, desc: 'Magnetic armour case for Galaxy with Qi2 magnets, raised bezels and precise S-Pen cut-outs on Ultra models.' },
  { name: 'Galaxy Clear Slim Case', cat: 'samsung-cases', price: 699, mrp: 1099, stock: 41, colors: [C.clear], models: SAM, pattern: 'clear', desc: 'Slim, flexible and crystal clear with anti-yellowing coating. Shows off your Galaxy design.' },
  { name: 'Fold & Flip Hinge Shield', cat: 'samsung-cases', price: 1699, mrp: 2599, stock: 9, colors: [C.black, C.lilac], models: FOLD, pattern: 'solid', n: true, desc: 'Two-piece shield with full hinge coverage for Galaxy foldables. Ultra-thin so the fold still feels natural.' },
  { name: 'Galaxy Silicone Grip Case', cat: 'samsung-cases', price: 749, mrp: 1199, stock: 3, colors: [C.sage, C.pink, C.black], models: SAM, pattern: 'solid', desc: 'Soft silicone with microfibre lining and a grippy finish for one-handed use.' },
  // Protectors
  { name: '9H Edge-to-Edge Tempered Glass', cat: 'protectors', price: 399, mrp: 799, stock: 120, colors: [C.clear], models: [...IP17, ...IP16, ...IP15, ...SAM], pattern: 'clear', t: true, f: true, desc: 'Japanese 9H glass with oleophobic coating and an alignment frame for bubble-free install in 30 seconds. Pack of 2.' },
  { name: 'Privacy Anti-Spy Glass', cat: 'protectors', price: 549, mrp: 999, stock: 75, colors: [C.black], models: [...IP17, ...IP16], pattern: 'solid', n: true, desc: 'Blocks side views beyond 30° so your chats stay private. Full touch sensitivity and Face ID friendly.' },
  { name: 'Camera Lens Protector Rings', cat: 'protectors', price: 349, mrp: 699, stock: 6, colors: [C.titan, C.black, C.blue], models: [...IP17, ...IP16], pattern: 'solid', desc: 'Individual aluminium + sapphire-glass rings for every lens. No flare at night, no extra bulk.' },
  { name: 'Matte Anti-Glare Glass', cat: 'protectors', price: 449, mrp: 899, stock: 50, colors: [C.clear], models: [...IP17, ...IP16, ...SAM], pattern: 'clear', desc: 'Matte finish that cuts glare outdoors and feels smooth for gaming. Resists fingerprints all day.' },
  // Watch straps
  { name: 'Alpine Loop Watch Strap', cat: 'watch-straps', price: 999, mrp: 1799, stock: 26, colors: [C.orange, C.sage, C.navy], models: WATCH, pattern: 'stripes', f: true, t: true, desc: 'Two-layer woven textile with a titanium G-hook. Lightweight, breathable and built for adventure.' },
  { name: 'Sport Silicone Band', cat: 'watch-straps', price: 599, mrp: 999, stock: 44, colors: [C.black, C.white, C.pink, C.blue], models: WATCH, pattern: 'solid', n: true, desc: 'Sweat-proof fluoroelastomer with a pin-and-tuck closure. Perfect for the gym and everyday wear.' },
  { name: 'Milanese Steel Loop', cat: 'watch-straps', price: 1299, mrp: 2199, stock: 12, colors: [C.titan, C.black], models: WATCH, pattern: 'dots', desc: 'Smooth stainless steel mesh with a magnetic closure that adjusts to a perfect fit.' },
  { name: 'Rugged Bumper Case for Watch', cat: 'watch-straps', price: 499, mrp: 899, stock: 2, colors: [C.black, C.orange], models: WATCH, pattern: 'solid', desc: 'Shock-proof bumper with built-in screen glass. Protects your watch from knocks and scratches.' },
  // AirPods
  { name: 'Armour AirPods Pro Case', cat: 'airpods-cases', price: 799, mrp: 1299, stock: 35, colors: [C.sand, C.black, C.orange], models: PODS, pattern: 'stripes', f: true, t: true, desc: 'Ridged rugged shell with a lanyard and carabiner. Wireless charging works right through the case.' },
  { name: 'Silicone AirPods Skin', cat: 'airpods-cases', price: 449, mrp: 799, stock: 60, colors: [C.lilac, C.sage, C.pink, C.white], models: PODS, pattern: 'solid', n: true, desc: 'Soft silicone skin with front LED window and a snug, dust-free fit.' },
  { name: 'Leather AirPods Pouch', cat: 'airpods-cases', price: 899, mrp: 1499, stock: 8, colors: [C.sand, C.black], models: PODS, pattern: 'solid', desc: 'Premium vegan leather pouch with a metal snap hook. Ages beautifully.' },
  // MagSafe & chargers
  { name: '15W MagSafe Wireless Charger', cat: 'magsafe-chargers', price: 1499, mrp: 2499, stock: 28, colors: [C.white, C.black], pattern: 'magsafe', f: true, t: true, desc: 'Snap-on magnetic charger with 15W fast charging, 1 m braided USB-C cable and smart temperature control.' },
  { name: '3-in-1 Foldable Charging Stand', cat: 'magsafe-chargers', price: 3499, mrp: 5499, stock: 10, colors: [C.black, C.white], pattern: 'solid', n: true, desc: 'Charge your iPhone, Watch and AirPods together. Folds flat for travel; includes 30W adapter.' },
  { name: '35W Dual USB-C GaN Adapter', cat: 'magsafe-chargers', price: 1199, mrp: 1999, stock: 55, colors: [C.white], pattern: 'solid', desc: 'Compact GaN charger with two USB-C ports. Fast-charges an iPhone to 50% in 30 minutes.' },
  { name: 'MagSafe Card Wallet', cat: 'magsafe-chargers', price: 699, mrp: 1199, stock: 0, colors: [C.sand, C.black, C.orange], pattern: 'stripes', desc: 'Strong magnetic wallet that holds 3 cards and doubles as a phone stand.' },
  // Power & cables
  { name: '10000mAh Magnetic Power Bank', cat: 'power-cables', price: 2199, mrp: 3499, stock: 18, colors: [C.white, C.black, C.lilac], pattern: 'solid', f: true, t: true, desc: 'Slim magnetic power bank with 20W USB-C PD, live battery display and a fold-out stand.' },
  { name: '20000mAh Travel Power Bank', cat: 'power-cables', price: 2499, mrp: 3999, stock: 14, colors: [C.black, C.navy], pattern: 'dots', n: true, desc: 'Charges a phone up to 4 times. 65W output also powers laptops and tablets.' },
  { name: 'Braided USB-C to USB-C Cable 2m', cat: 'power-cables', price: 499, mrp: 899, stock: 90, colors: [C.orange, C.black, C.white], pattern: 'solid', t: true, desc: '60W fast-charge cable with nylon braid tested to 30,000 bends. Long enough for the sofa.' },
  { name: 'USB-C to Lightning Cable 1m', cat: 'power-cables', price: 449, mrp: 799, stock: 5, colors: [C.white], pattern: 'solid', desc: 'Certified fast-charging cable for older iPhones and AirPods.' },
];

const categories = [
  { name: 'iPhone Cases', slug: 'iphone-cases', tagline: 'MagSafe-ready armour for every iPhone', art: 'case', color: '#2563EB' },
  { name: 'Samsung Cases', slug: 'samsung-cases', tagline: 'Precise fits for Galaxy S, Fold & Flip', art: 'case', color: '#2F7FD1' },
  { name: 'Screen Protectors', slug: 'protectors', tagline: '9H glass, privacy & lens guards', art: 'protector', color: '#5FA8A0' },
  { name: 'Watch Straps', slug: 'watch-straps', tagline: 'Loops, bands and bumpers for Apple Watch', art: 'watch', color: '#E09F3E' },
  { name: 'AirPods Cases', slug: 'airpods-cases', tagline: 'Rugged and soft cases with lanyards', art: 'airpods', color: '#9C7BD3' },
  { name: 'MagSafe & Chargers', slug: 'magsafe-chargers', tagline: 'Fast, magnetic, desk-ready', art: 'charger', color: '#1E1E1E' },
  { name: 'Power & Cables', slug: 'power-cables', tagline: 'Power banks and braided cables', art: 'powerbank', color: '#3C8D5A' },
];

const reviewers = ['Aarav S.', 'Priya M.', 'Rohan K.', 'Sneha P.', 'Vikram J.', 'Ananya R.', 'Kabir T.', 'Ishita D.', 'Arjun N.', 'Meera L.'];
const reviewText = [
  'Fits perfectly and the magnets are really strong. Looks even better in person!',
  'Survived a fall on the road from my bike — not a scratch on the phone. Worth it.',
  'Delivery was quick and the packaging felt premium. Colour is exactly as shown.',
  'Very good quality for the price. The buttons are clicky and the grip is great.',
  'Bought one for me and one for my sister. Both of us love it.',
  'Cash on delivery made it easy, and the courier called before coming. Happy customer.',
  'Slim but strong. Camera lip protects the lenses well on the table.',
  'Exactly what I needed. Will order the matching strap next.',
];

async function main() {
  console.log('Seeding…');
  await prisma.$transaction([
    prisma.orderEvent.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.review.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
    prisma.deliveryPartner.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.message.deleteMany(),
  ]);

  const cats: Record<string, string> = {};
  for (const [i, c] of categories.entries()) cats[c.slug] = (await prisma.category.create({ data: { ...c, sort: i, image: CATEGORY_PHOTOS[c.slug] || '' } })).id;

  const artFor = (cat: string) => categories.find((c) => c.slug === cat)!.art;
  const created = [];
  for (const [i, p] of products.entries()) {
    created.push(
      await prisma.product.create({
        data: {
          name: p.name,
          slug: slug(p.name),
          sku: `AW-${String(1001 + i)}`,
          description: p.desc,
          price: p.price,
          mrp: p.mrp,
          stock: p.stock,
          categoryId: cats[p.cat],
          models: JSON.stringify(p.models || []),
          colors: JSON.stringify(p.colors),
          images: JSON.stringify(PRODUCT_PHOTOS[p.name] || []),
          art: p.cat === 'power-cables' && p.name.includes('Cable') ? 'cable' : artFor(p.cat),
          pattern: p.pattern || 'solid',
          featured: !!p.f,
          isNew: !!p.n,
          trending: !!p.t,
          createdAt: new Date(Date.now() - (products.length - i) * 86400000 * (p.n ? 0.2 : 1.5)),
        },
      }),
    );
  }

  const admin = await prisma.user.create({
    data: { name: 'Store Admin', email: 'admin@alliswell.local', role: 'ADMIN', passwordHash: await bcrypt.hash('Admin@123', 10) },
  });
  const customers = [];
  const people = [
    ['Riya Sharma', 'riya@example.com', '9810012345', 'Delhi', 'Delhi', '110017'],
    ['Aditya Verma', 'aditya@example.com', '9820098765', 'Mumbai', 'Maharashtra', '400050'],
    ['Neha Gupta', 'neha@example.com', '9830011122', 'Kolkata', 'West Bengal', '700019'],
    ['Karan Mehta', 'karan@example.com', '9845033344', 'Bengaluru', 'Karnataka', '560034'],
    ['Pooja Iyer', 'pooja@example.com', '9840055566', 'Chennai', 'Tamil Nadu', '600017'],
  ];
  for (const [name, email, phone, city, state, pincode] of people) {
    const u = await prisma.user.create({ data: { name, email, phone, passwordHash: await bcrypt.hash('customer123', 10) } });
    await prisma.address.create({ data: { userId: u.id, fullName: name, phone, line1: `${12 + customers.length * 7}, Green Park Avenue`, line2: 'Near Metro Station', city, state, pincode, isDefault: true } });
    customers.push({ ...u, city, state, pincode });
  }

  const partners = await Promise.all([
    prisma.deliveryPartner.create({ data: { name: 'Delhivery', contactPerson: 'Pickup desk', phone: '+91 124 6719500', trackingUrl: 'https://www.delhivery.com/track/package/{tracking}' } }),
    prisma.deliveryPartner.create({ data: { name: 'Blue Dart', contactPerson: 'Branch manager', phone: '+91 1860 233 1234', trackingUrl: 'https://www.bluedart.com/tracking?awb={tracking}' } }),
    prisma.deliveryPartner.create({ data: { name: 'Own Rider (Local)', contactPerson: 'Rahul', phone: '+91 98111 22233', trackingUrl: '' } }),
  ]);

  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', type: 'PERCENT', value: 10, minOrder: 499, maxDiscount: 250, usageLimit: 1000 },
      { code: 'FLAT150', type: 'FLAT', value: 150, minOrder: 1499 },
      { code: 'COMBO20', type: 'PERCENT', value: 20, minOrder: 2999, maxDiscount: 800 },
    ],
  });

  // reviews
  for (const [i, p] of created.entries()) {
    const n = 2 + (i % 4);
    for (let k = 0; k < n; k++) {
      await prisma.review.create({
        data: {
          productId: p.id,
          name: reviewers[(i + k) % reviewers.length],
          rating: k % 5 === 3 ? 4 : 5,
          comment: reviewText[(i * 3 + k) % reviewText.length],
          approved: true,
          verified: true,
          createdAt: new Date(Date.now() - (i + k) * 3600000 * 20),
        },
      });
    }
    const agg = await prisma.review.aggregate({ where: { productId: p.id }, _avg: { rating: true }, _count: true });
    await prisma.product.update({ where: { id: p.id }, data: { rating: Math.round((agg._avg.rating || 5) * 10) / 10, reviewCount: agg._count * 17 + (i % 7) * 9 } });
  }

  // sample orders across the last 14 days
  const flow = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  for (let i = 0; i < 22; i++) {
    const cu = customers[i % customers.length];
    const picks = [created[(i * 5) % created.length], created[(i * 7 + 3) % created.length]].slice(0, 1 + (i % 2));
    const items = picks.map((p) => {
      const colors = JSON.parse(p.colors);
      const models = JSON.parse(p.models);
      return { productId: p.id, name: p.name, sku: p.sku, price: p.price, qty: 1 + (i % 3 === 0 ? 1 : 0), color: colors[0].name, colorHex: colors[0].hex, art: p.art, pattern: p.pattern, image: (JSON.parse(p.images) as string[])[0] || null, model: models[0] || null };
    });
    const subtotal = items.reduce((a, it) => a + it.price * it.qty, 0);
    const shipping = subtotal >= 999 ? 0 : 79;
    const daysAgo = Math.floor(i * 0.62);
    const created_at = new Date(Date.now() - daysAgo * 86400000 - (i % 5) * 3600000);
    const status = i === 7 ? 'CANCELLED' : flow[Math.min(flow.length - 1, Math.floor(daysAgo / 2) + (i % 2))];
    const reached = status === 'CANCELLED' ? ['PLACED', 'CANCELLED'] : flow.slice(0, flow.indexOf(status) + 1);
    const shipped = flow.indexOf(status) >= 3;
    await prisma.order.create({
      data: {
        number: `AW${created_at.toISOString().slice(2, 10).replace(/-/g, '')}${1000 + i * 37}`,
        userId: cu.id,
        customerName: cu.name,
        email: cu.email,
        phone: cu.phone!,
        line1: `${12 + i}, Green Park Avenue`,
        line2: 'Near Metro Station',
        city: cu.city,
        state: cu.state,
        pincode: cu.pincode,
        subtotal,
        shipping,
        total: subtotal + shipping,
        paymentStatus: status === 'DELIVERED' ? 'PAID' : 'PENDING',
        status,
        partnerId: shipped ? partners[i % partners.length].id : null,
        trackingNumber: shipped ? `AWB${88000000 + i * 1313}` : null,
        createdAt: created_at,
        items: { create: items },
        events: { create: reached.map((s, k) => ({ status: s, createdAt: new Date(created_at.getTime() + k * 7 * 3600000) })) },
      },
    });
  }

  await prisma.message.create({
    data: { name: "Sahil", email: 'sahil@example.com', phone: '9876500000', subject: 'Bulk order', body: 'Hi, I run a small shop in Noida. Can I get wholesale pricing for 50 clear cases?' },
  });

  console.log(`✅ Seeded ${created.length} products, ${customers.length} customers, 22 orders. Admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
