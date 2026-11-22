import { Router } from 'express';
import crypto from 'crypto';
import type { Prisma } from '@prisma/client';
import { couponDiscount, fail, getSettings, int, optionalAuth, prisma, requireAuth, sendMail, str, toProduct } from '../lib';
import { cleanText, escapeHtml, rateLimit } from '../security';
import { gateway, razorpay, verifyCheckoutSignature } from '../payments';

export const storeRouter = Router();
storeRouter.use(optionalAuth);

const live: Prisma.ProductWhereInput = { status: 'PUBLISHED' };
const withCat = { category: { select: { name: true, slug: true } } } as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- catalogue ---------- */
storeRouter.get('/settings', async (_req, res) => {
  res.json({ ...(await getSettings()), onlinePayments: razorpay.enabled() ? 'true' : 'false' });
});

storeRouter.get('/categories', async (_req, res) => {
  const cats = await prisma.category.findMany({
    orderBy: { sort: 'asc' },
    include: { _count: { select: { products: { where: live } } } },
  });
  res.json(cats.map(({ _count, ...c }) => ({ ...c, count: _count.products })));
});

storeRouter.get('/filters', async (_req, res) => {
  const all = await prisma.product.findMany({ where: live, select: { models: true, price: true } });
  const models = new Set<string>();
  let maxPrice = 0;
  for (const p of all) {
    (JSON.parse(p.models) as string[]).forEach((m) => models.add(m));
    maxPrice = Math.max(maxPrice, p.price);
  }
  res.json({ models: [...models].sort(), maxPrice });
});

storeRouter.get('/products', async (req, res) => {
  const q = str(req.query.q).slice(0, 60);
  const category = str(req.query.category).slice(0, 60);
  const model = str(req.query.model).slice(0, 60);
  const flag = str(req.query.flag);
  const sort = str(req.query.sort) || 'popular';
  const min = int(req.query.min, 0);
  const max = int(req.query.max, 0);
  const limit = Math.min(Math.max(1, int(req.query.limit, 60)), 100);

  const where: Prisma.ProductWhereInput = { ...live, AND: [] };
  const and = where.AND as Prisma.ProductWhereInput[];
  if (q) and.push({ OR: [{ name: { contains: q } }, { models: { contains: q } }, { sku: { contains: q } }, { category: { name: { contains: q } } }] });
  if (category) and.push({ category: { slug: category } });
  if (model) and.push({ OR: [{ models: { contains: `"${model}"` } }, { models: '[]' }] });
  if (min) and.push({ price: { gte: min } });
  if (max) and.push({ price: { lte: max } });
  if (flag === 'featured') and.push({ featured: true });
  if (flag === 'new') and.push({ isNew: true });
  if (flag === 'trending') and.push({ trending: true });
  if (str(req.query.inStock) === '1') and.push({ stock: { gt: 0 } });

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === 'price-asc' ? { price: 'asc' } : sort === 'price-desc' ? { price: 'desc' } : sort === 'newest' ? { createdAt: 'desc' } : sort === 'rating' ? { rating: 'desc' } : { reviewCount: 'desc' };

  let list = (await prisma.product.findMany({ where, orderBy, include: withCat })).map(toProduct);
  if (flag === 'sale') list = list.filter((p) => p.mrp > p.price);
  res.json({ total: list.length, products: list.slice(0, limit) });
});

storeRouter.get('/products/:slug', async (req, res) => {
  const p = await prisma.product.findFirst({
    where: { slug: String(req.params.slug), ...live },
    include: { ...withCat, reviews: { where: { approved: true }, orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!p) fail(404, 'Product not found.');
  const related = await prisma.product.findMany({
    where: { ...live, categoryId: p!.categoryId, id: { not: p!.id } },
    include: withCat,
    orderBy: { reviewCount: 'desc' },
    take: 4,
  });
  // never expose reviewer account ids publicly
  const reviews = p!.reviews.map(({ userId: _u, ...r }) => r);
  res.json({ product: toProduct({ ...p!, reviews: undefined } as never), reviews, related: related.map(toProduct) });
});

/* ---------- reviews ---------- */
const reviewLimit = rateLimit({ name: 'review', max: 5, windowMs: 60 * 60_000, message: 'You have posted several reviews recently. Please try again later.' });
storeRouter.post('/products/:id/reviews', reviewLimit, async (req, res) => {
  const rating = Math.max(1, Math.min(5, int(req.body?.rating, 5)));
  const comment = cleanText(req.body?.comment, 1000);
  const name = req.user?.name || cleanText(req.body?.name, 60);
  if (!name || comment.length < 3) fail(400, 'Please add your name and a short review.');
  const product = await prisma.product.findUnique({ where: { id: String(req.params.id) } });
  if (!product) fail(404, 'Product not found.');
  // Verified buyers (a delivered order with this product) publish instantly; everyone else waits for admin approval.
  const verified = !!req.user && (await prisma.orderItem.count({ where: { productId: product!.id, order: { userId: req.user.id, status: 'DELIVERED' } } })) > 0;
  const review = await prisma.review.create({ data: { productId: product!.id, userId: req.user?.id, name, rating, comment, verified, approved: verified } });
  await recalcRating(product!.id);
  res.json({ review: { ...review, userId: undefined }, pending: !verified });
});

export async function recalcRating(productId: string) {
  const agg = await prisma.review.aggregate({ where: { productId, approved: true }, _avg: { rating: true }, _count: true });
  await prisma.product.update({
    where: { id: productId },
    data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, reviewCount: agg._count },
  });
}

storeRouter.get('/reviews/top', async (_req, res) => {
  const reviews = await prisma.review.findMany({
    where: { approved: true, rating: { gte: 4 } },
    orderBy: { createdAt: 'desc' },
    take: 9,
    select: { id: true, name: true, rating: true, comment: true, verified: true, createdAt: true, product: { select: { name: true, slug: true } } },
  });
  res.json(reviews);
});

/* ---------- checkout ---------- */
const couponLimit = rateLimit({ name: 'coupon', max: 20, windowMs: 10 * 60_000 });
storeRouter.post('/coupons/validate', couponLimit, async (req, res) => {
  const { discount, coupon } = await couponDiscount(str(req.body?.code), Math.max(0, int(req.body?.subtotal)));
  res.json({ discount, code: coupon?.code });
});

type InItem = { productId: string; qty: number; model?: string; color?: string };
export const LIMITS = { maxLines: 20, maxQtyPerLine: 10, maxUnits: 30 };
const orderLimit = rateLimit({ name: 'order', max: 10, windowMs: 30 * 60_000, message: 'Too many orders from this network. Please wait a little or contact us.' });

const restock = (tx: Prisma.TransactionClient, items: { productId: string | null; qty: number }[]) =>
  Promise.all(items.filter((i) => i.productId).map((i) => tx.product.update({ where: { id: i.productId! }, data: { stock: { increment: i.qty } } })));

storeRouter.post('/orders', orderLimit, async (req, res) => {
  const b = req.body || {};
  const c = b.customer || {};
  const a = b.address || {};
  const items: InItem[] = Array.isArray(b.items) ? b.items : [];
  const customer = { name: cleanText(c.name, 80), email: cleanText(c.email, 120).toLowerCase(), phone: str(c.phone).replace(/\D/g, '').slice(-10) };
  const addr = { line1: cleanText(a.line1, 160), line2: cleanText(a.line2, 160) || null, city: cleanText(a.city, 60), state: cleanText(a.state, 60), pincode: str(a.pincode) };

  if (customer.name.length < 2 || !EMAIL.test(customer.email)) fail(400, 'Please add your name and email.');
  if (!/^[6-9]\d{9}$/.test(customer.phone)) fail(400, 'Please enter a valid 10-digit Indian mobile number.');
  if (!addr.line1 || !addr.city || !addr.state || !/^[1-9]\d{5}$/.test(addr.pincode)) fail(400, 'Please complete your delivery address.');
  if (!items.length) fail(400, 'Your cart is empty.');
  if (items.length > LIMITS.maxLines) fail(400, `Please split very large orders (max ${LIMITS.maxLines} different items).`);

  const settings = await getSettings();
  const method = str(b.paymentMethod) === 'ONLINE' ? 'ONLINE' : 'COD';
  if (method === 'ONLINE' && !razorpay.enabled()) fail(400, 'Online payment is not available yet — please choose Cash on Delivery.');
  if (method === 'COD' && settings.codEnabled !== 'true') fail(400, 'Cash on Delivery is currently unavailable.');

  const order = await prisma.$transaction(async (tx) => {
    let subtotal = 0;
    let units = 0;
    const lines: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    for (const it of items) {
      const qty = Math.min(LIMITS.maxQtyPerLine, Math.max(1, int(it?.qty, 1)));
      units += qty;
      if (units > LIMITS.maxUnits) fail(400, `For bulk orders above ${LIMITS.maxUnits} pieces please contact us for wholesale pricing.`);
      const p = await tx.product.findUnique({ where: { id: String(it?.productId) } });
      if (!p || p.status !== 'PUBLISHED') fail(400, 'An item in your cart is no longer available.');
      const models = JSON.parse(p!.models) as string[];
      const model = it.model ? cleanText(it.model, 60) : null;
      if (model && models.length && !models.includes(model)) fail(400, `"${p!.name}" does not fit ${model}.`);
      if (models.length > 1 && !model) fail(400, `Please choose your phone model for "${p!.name}".`);
      // atomic reserve: only succeeds while enough stock is left (safe when two people buy the last piece at once)
      const reserved = await tx.product.updateMany({ where: { id: p!.id, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
      if (reserved.count === 0) fail(400, `Only ${p!.stock} left of "${p!.name}". Please update your cart.`);
      const colors = JSON.parse(p!.colors) as { name: string; hex: string }[];
      const color = colors.find((x) => x.name === it.color) || colors[0];
      subtotal += p!.price * qty;
      lines.push({
        product: { connect: { id: p!.id } },
        name: p!.name,
        sku: p!.sku,
        model: model || (models.length === 1 ? models[0] : null),
        color: color?.name || null,
        colorHex: color?.hex || '#222222',
        art: p!.art,
        pattern: p!.pattern,
        image: (JSON.parse(p!.images) as string[])[0] || null,
        price: p!.price,
        qty,
      });
    }
    const { discount, coupon } = await couponDiscount(str(b.couponCode) || undefined, subtotal);
    const shipping = subtotal - discount >= int(settings.freeShippingAbove) ? 0 : int(settings.shippingFee);
    const codFee = method === 'COD' ? int(settings.codFee) : 0;
    if (coupon) {
      // atomic: respects usageLimit even under simultaneous checkouts
      const used = await tx.coupon.updateMany({
        where: { code: coupon.code, ...(coupon.usageLimit ? { usedCount: { lt: coupon.usageLimit } } : {}) },
        data: { usedCount: { increment: 1 } },
      });
      if (used.count === 0) fail(400, 'This coupon has reached its usage limit.');
    }

    // India date (YYMMDD) + 6 random digits — hard to guess
    const ist = new Date(Date.now() + 5.5 * 3600000).toISOString();
    const number = `AW${ist.slice(2, 10).replace(/-/g, '')}${crypto.randomInt(100000, 1000000)}`;
    const pending = method === 'ONLINE';
    return tx.order.create({
      data: {
        number,
        userId: req.user?.id,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        ...addr,
        subtotal,
        discount,
        shipping,
        codFee,
        total: subtotal - discount + shipping + codFee,
        couponCode: coupon?.code,
        paymentMethod: method,
        status: pending ? 'PENDING_PAYMENT' : 'PLACED',
        note: cleanText(b.note, 500) || null,
        items: { create: lines },
        events: { create: { status: pending ? 'PENDING_PAYMENT' : 'PLACED', note: pending ? 'Waiting for online payment' : 'Order placed' } },
      },
      include: { items: true },
    });
  });

  if (method === 'ONLINE') {
    try {
      const g = await gateway.createOrder(order.total * 100, order.number);
      await prisma.order.update({ where: { id: order.id }, data: { gatewayOrderId: g.id } });
      res.json({
        number: order.number,
        phone: order.phone,
        payment: {
          provider: 'razorpay',
          keyId: razorpay.keyId(),
          gatewayOrderId: g.id,
          amount: g.amount,
          currency: g.currency,
          name: settings.storeName,
          prefill: { name: order.customerName, email: order.email, contact: order.phone },
        },
      });
      return;
    } catch (e) {
      console.error(e);
      await cancelUnpaid(order.id, 'Payment gateway unavailable');
      fail(502, 'Could not start online payment. Please try again or choose Cash on Delivery.');
    }
  }

  orderConfirmedMail(order, settings.storeName);
  res.json({ number: order.number, phone: order.phone });
});

type MailOrder = { email: string; number: string; customerName: string; total: number; paymentMethod: string; items: { qty: number; name: string; model: string | null; price: number }[] };
function orderConfirmedMail(order: MailOrder, store: string) {
  sendMail(
    order.email,
    `Order ${order.number} confirmed`,
    `<p>Hi ${escapeHtml(order.customerName)}, thanks for shopping with ${escapeHtml(store)}!</p>
     <ul>${order.items.map((i) => `<li>${i.qty} × ${escapeHtml(i.name)} ${i.model ? `(${escapeHtml(i.model)})` : ''} — ₹${i.price * i.qty}</li>`).join('')}</ul>
     <p><b>Total: ₹${order.total}</b> · ${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid online'}</p>`,
  );
}

async function cancelUnpaid(orderId: string, note: string) {
  await prisma.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!o || o.status !== 'PENDING_PAYMENT') return;
    await restock(tx, o.items);
    if (o.couponCode) await tx.coupon.updateMany({ where: { code: o.couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
    await tx.order.update({ where: { id: o.id }, data: { status: 'CANCELLED', paymentStatus: 'FAILED', events: { create: { status: 'CANCELLED', note } } } });
  });
}

/** Marks an online order paid — only after every check passes. Safe to call twice (idempotent). */
export async function markPaid(gatewayOrderId: string, paymentId: string) {
  const order = await prisma.order.findUnique({ where: { gatewayOrderId }, include: { items: true } });
  if (!order) fail(404, 'Order not found for this payment.');
  if (order!.paymentStatus === 'PAID') {
    if (order!.gatewayPaymentId === paymentId) return order!;
    fail(409, 'This order is already paid.');
  }
  if (await prisma.order.findUnique({ where: { gatewayPaymentId: paymentId } })) fail(409, 'This payment was already used for another order.');
  const p = await gateway.fetchPayment(paymentId);
  if (p.order_id !== gatewayOrderId) fail(400, 'Payment does not belong to this order.');
  if (p.currency !== 'INR' || p.amount !== order!.total * 100) fail(400, 'Paid amount does not match the order total.');
  if (!['captured', 'authorized'].includes(p.status)) fail(400, 'Payment is not complete yet.');
  if (order!.status === 'CANCELLED') fail(409, 'This order expired before payment. Please contact us for a refund.');
  const updated = await prisma.order.update({
    where: { id: order!.id },
    data: { paymentStatus: 'PAID', gatewayPaymentId: paymentId, status: 'PLACED', events: { create: { status: 'PLACED', note: 'Paid online' } } },
    include: { items: true },
  });
  orderConfirmedMail(updated, (await getSettings()).storeName);
  return updated;
}

const payLimit = rateLimit({ name: 'pay', max: 20, windowMs: 10 * 60_000 });
storeRouter.post('/payments/verify', payLimit, async (req, res) => {
  const b = req.body || {};
  const gOrder = str(b.razorpay_order_id);
  const gPay = str(b.razorpay_payment_id);
  const order = await prisma.order.findUnique({ where: { number: str(b.number) } });
  if (!order || !order.gatewayOrderId || order.gatewayOrderId !== gOrder) fail(400, 'Payment does not match this order.');
  if (!verifyCheckoutSignature(gOrder, gPay, str(b.razorpay_signature))) fail(400, 'Payment signature is invalid.');
  const paid = await markPaid(gOrder, gPay);
  res.json({ ok: true, number: paid.number });
});

/** Release stock held by online orders that were never paid. */
export async function sweepUnpaid(maxAgeMs = 30 * 60_000) {
  const stale = await prisma.order.findMany({ where: { status: 'PENDING_PAYMENT', createdAt: { lt: new Date(Date.now() - maxAgeMs) } }, select: { id: true } });
  for (const o of stale) await cancelUnpaid(o.id, 'Payment not completed in 30 minutes');
  return stale.length;
}

/* ---------- order lookup ---------- */
const orderInclude = {
  items: true,
  events: { orderBy: { createdAt: 'asc' } },
  partner: { select: { name: true, trackingUrl: true, phone: true } },
} satisfies Prisma.OrderInclude;
const publicOrder = <T extends { gatewayOrderId: string | null; gatewayPaymentId: string | null }>({ gatewayOrderId: _g, gatewayPaymentId: _p, ...o }: T) => o;

storeRouter.get('/orders/mine', requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({ where: { userId: req.user!.id }, include: orderInclude, orderBy: { createdAt: 'desc' } });
  res.json(orders.map(publicOrder));
});

/** Owner (logged in) or anyone with the order number AND matching phone. Rate-limited against guessing. */
const lookupLimit = rateLimit({ name: 'lookup', max: 20, windowMs: 10 * 60_000, message: 'Too many lookups. Please wait a few minutes.' });
storeRouter.get('/orders/:number', lookupLimit, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { number: str(req.params.number).toUpperCase() }, include: orderInclude });
  const phone = str(req.query.phone).replace(/\D/g, '').slice(-10);
  const allowed = order && ((req.user && (req.user.id === order.userId || req.user.role === 'ADMIN')) || (phone.length === 10 && phone === order.phone));
  if (!allowed) fail(404, 'We could not find an order with those details.');
  res.json(publicOrder(order!));
});

storeRouter.post('/orders/:number/cancel', lookupLimit, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { number: String(req.params.number) }, include: { items: true } });
  const phone = str(req.body?.phone).replace(/\D/g, '').slice(-10);
  if (!order || !((req.user && req.user.id === order.userId) || (phone.length === 10 && phone === order.phone))) fail(404, 'Order not found.');
  if (!['PLACED', 'CONFIRMED'].includes(order!.status)) fail(400, 'This order is already packed and can no longer be cancelled.');
  if (order!.paymentStatus === 'PAID') fail(400, 'Paid orders are cancelled by our team so the refund is handled correctly. Please contact us.');
  await prisma.$transaction(async (tx) => {
    await restock(tx, order!.items);
    await tx.order.update({ where: { id: order!.id }, data: { status: 'CANCELLED', events: { create: { status: 'CANCELLED', note: 'Cancelled by customer' } } } });
  });
  res.json({ ok: true });
});

/* ---------- misc ---------- */
const formLimit = rateLimit({ name: 'form', max: 5, windowMs: 15 * 60_000, message: 'Thanks! We already got your message — please wait a little before sending more.' });
storeRouter.post('/newsletter', formLimit, async (req, res) => {
  const email = cleanText(req.body?.email, 120).toLowerCase();
  if (!EMAIL.test(email)) fail(400, 'Please enter a valid email.');
  await prisma.subscriber.upsert({ where: { email }, update: {}, create: { email } });
  res.json({ ok: true });
});

storeRouter.post('/contact', formLimit, async (req, res) => {
  const b = req.body || {};
  const data = { name: cleanText(b.name, 80), email: cleanText(b.email, 120), phone: cleanText(b.phone, 20) || null, subject: cleanText(b.subject, 80) || 'General', body: cleanText(b.body, 3000) };
  if (!data.name || !EMAIL.test(data.email) || data.body.length < 5) fail(400, 'Please fill your name, email and message.');
  await prisma.message.create({ data });
  res.json({ ok: true });
});
