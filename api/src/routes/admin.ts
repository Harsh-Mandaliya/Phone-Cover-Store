import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { DEFAULT_SETTINGS, fail, getSettings, int, ORDER_STATUSES, prisma, sendMail, slugify, str, toProduct } from '../lib';
import { recalcRating } from './store';
import { cleanText, csvCell, escapeHtml } from '../security';

export const adminRouter = Router();

/* ---------- dashboard ---------- */
adminRouter.get('/stats', async (_req, res) => {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 13);

  const [orders, recent, products, customers, unread] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: since } }, select: { total: true, status: true, createdAt: true } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { items: { take: 1 } } }),
    prisma.product.findMany({ select: { id: true, name: true, stock: true, lowStockAt: true, art: true, colors: true, pattern: true, images: true } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.message.count({ where: { read: false } }),
  ]);
  const all = await prisma.order.groupBy({ by: ['status'], _count: true, _sum: { total: true } });

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 };
  });
  for (const o of orders) {
    if (o.status === 'CANCELLED') continue;
    const day = days.find((d) => d.date === o.createdAt.toISOString().slice(0, 10));
    if (day) {
      day.revenue += o.total;
      day.orders += 1;
    }
  }
  const byStatus = Object.fromEntries(all.map((s) => [s.status, s._count]));
  const revenue = all.filter((s) => !['CANCELLED', 'RETURNED'].includes(s.status)).reduce((a, s) => a + (s._sum.total || 0), 0);
  const top = await prisma.orderItem.groupBy({ by: ['productId', 'name'], _sum: { qty: true }, orderBy: { _sum: { qty: 'desc' } }, take: 5 });

  res.json({
    revenue,
    orders: all.reduce((a, s) => a + s._count, 0),
    pending: (byStatus.PLACED || 0) + (byStatus.CONFIRMED || 0) + (byStatus.PACKED || 0),
    newOrders: byStatus.PLACED || 0, // waiting for the admin to confirm (header bell)
    customers,
    unread,
    byStatus,
    days,
    recent,
    top: top.map((t) => ({ name: t.name, sold: t._sum.qty || 0 })),
    lowStock: products.filter((p) => p.stock <= p.lowStockAt).sort((a, b) => a.stock - b.stock).slice(0, 6).map((p) => ({ ...p, colors: JSON.parse(p.colors), images: JSON.parse(p.images) })),
    stock: {
      total: products.length,
      inStock: products.filter((p) => p.stock > p.lowStockAt).length,
      low: products.filter((p) => p.stock > 0 && p.stock <= p.lowStockAt).length,
      out: products.filter((p) => p.stock <= 0).length,
    },
  });
});

/* ---------- uploads (local disk, free alternative to Cloudinary) ---------- */
const MIME_EXT: Record<string, string> = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${MIME_EXT[file.mimetype] || '.bin'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  // extension comes from the checked type, never from the uploaded file name (no .html/.svg tricks)
  fileFilter: (_req, file, cb) => cb(null, file.mimetype in MIME_EXT),
});
adminRouter.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) fail(400, 'Please choose a PNG, JPG or WEBP image under 5 MB.');
  res.json({ url: `/uploads/${req.file!.filename}` });
});

/* ---------- products ---------- */
adminRouter.get('/products', async (req, res) => {
  const q = str(req.query.q);
  const where: Prisma.ProductWhereInput = {};
  if (q) where.OR = [{ name: { contains: q } }, { sku: { contains: q } }];
  if (str(req.query.category)) where.categoryId = str(req.query.category);
  if (str(req.query.status)) where.status = str(req.query.status);
  let list = (await prisma.product.findMany({ where, include: { category: { select: { name: true, slug: true } } }, orderBy: { updatedAt: 'desc' } })).map(toProduct);
  const stock = str(req.query.stock);
  if (stock === 'out') list = list.filter((p) => p.stock <= 0);
  if (stock === 'low') list = list.filter((p) => p.stock > 0 && p.stock <= p.lowStockAt);
  if (stock === 'in') list = list.filter((p) => p.stock > p.lowStockAt);
  res.json(list);
});

function productData(b: Record<string, unknown>) {
  const name = str(b.name);
  if (!name) fail(400, 'Product name is required.');
  if (!str(b.categoryId)) fail(400, 'Please choose a category.');
  const price = int(b.price);
  if (price <= 0) fail(400, 'Price must be more than 0.');
  const arr = (v: unknown) => JSON.stringify(Array.isArray(v) ? v : []);
  return {
    name,
    description: str(b.description),
    price,
    mrp: Math.max(int(b.mrp, price), price),
    stock: Math.max(0, int(b.stock)),
    lowStockAt: Math.max(0, int(b.lowStockAt, 5)),
    categoryId: str(b.categoryId),
    models: arr(b.models),
    colors: arr(b.colors),
    images: arr(b.images),
    art: str(b.art) || 'case',
    pattern: str(b.pattern) || 'solid',
    featured: !!b.featured,
    isNew: !!b.isNew,
    trending: !!b.trending,
    status: b.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
  };
}

adminRouter.post('/products', async (req, res) => {
  const data = productData(req.body);
  let slug = slugify(data.name);
  if (await prisma.product.findUnique({ where: { slug } })) slug = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
  const sku = str(req.body.sku) || `AW-${Date.now().toString().slice(-6)}`;
  if (await prisma.product.findUnique({ where: { sku } })) fail(409, 'This SKU is already used by another product.');
  res.json(toProduct(await prisma.product.create({ data: { ...data, slug, sku } })));
});

adminRouter.put('/products/:id', async (req, res) => {
  const data = productData(req.body);
  const sku = str(req.body.sku);
  if (sku) {
    const other = await prisma.product.findUnique({ where: { sku } });
    if (other && other.id !== req.params.id) fail(409, 'This SKU is already used by another product.');
  }
  res.json(toProduct(await prisma.product.update({ where: { id: req.params.id }, data: { ...data, ...(sku ? { sku } : {}) } })));
});

adminRouter.patch('/products/:id/stock', async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!p) fail(404, 'Product not found.');
  const stock = req.body.set !== undefined ? int(req.body.set) : p!.stock + int(req.body.delta);
  res.json(toProduct(await prisma.product.update({ where: { id: p!.id }, data: { stock: Math.max(0, stock) } })));
});

adminRouter.patch('/products/:id/status', async (req, res) => {
  const status = req.body.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';
  res.json(toProduct(await prisma.product.update({ where: { id: req.params.id }, data: { status } })));
});

adminRouter.delete('/products/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* ---------- categories ---------- */
adminRouter.get('/categories', async (_req, res) => {
  const cats = await prisma.category.findMany({ orderBy: { sort: 'asc' }, include: { _count: { select: { products: true } } } });
  res.json(cats.map(({ _count, ...c }) => ({ ...c, count: _count.products })));
});
const catData = (b: Record<string, unknown>) => {
  const name = str(b.name);
  if (!name) fail(400, 'Category name is required.');
  const image = str(b.image);
  if (image && !/^(https:\/\/|\/uploads\/)/.test(image)) fail(400, 'Image must be an https:// link or an uploaded file.');
  return { name, slug: slugify(str(b.slug) || name), tagline: str(b.tagline), art: str(b.art) || 'case', color: str(b.color) || '#2563EB', sort: int(b.sort), image };
};
adminRouter.post('/categories', async (req, res) => {
  res.json(await prisma.category.create({ data: catData(req.body) }));
});
adminRouter.put('/categories/:id', async (req, res) => {
  res.json(await prisma.category.update({ where: { id: req.params.id }, data: catData(req.body) }));
});
adminRouter.delete('/categories/:id', async (req, res) => {
  if (await prisma.product.count({ where: { categoryId: req.params.id } })) fail(400, 'Move or delete the products in this category first.');
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* ---------- orders ---------- */
const orderWhere = (query: Record<string, unknown>): Prisma.OrderWhereInput => {
  const where: Prisma.OrderWhereInput = {};
  const q = str(query.q);
  if (q) where.OR = [{ number: { contains: q } }, { customerName: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }];
  if (str(query.status)) where.status = str(query.status);
  if (str(query.partner)) where.partnerId = str(query.partner);
  return where;
};

adminRouter.get('/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: orderWhere(req.query),
    orderBy: { createdAt: 'desc' },
    include: { items: true, partner: { select: { name: true } } },
    take: 300,
  });
  const counts = await prisma.order.groupBy({ by: ['status'], _count: true });
  res.json({ orders, counts: Object.fromEntries(counts.map((c) => [c.status, c._count])) });
});

adminRouter.get('/orders.csv', async (req, res) => {
  const orders = await prisma.order.findMany({ where: orderWhere(req.query), orderBy: { createdAt: 'desc' }, include: { items: true, partner: true } });
  const rows = [
    ['Order', 'Date', 'Customer', 'Phone', 'Email', 'Address', 'Pincode', 'Items', 'Total', 'Payment', 'Status', 'Partner', 'Tracking'],
    ...orders.map((o) => [
      o.number,
      o.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      o.customerName,
      o.phone,
      o.email,
      `${o.line1} ${o.line2 || ''}, ${o.city}, ${o.state}`,
      o.pincode,
      o.items.map((i) => `${i.qty}x ${i.name}${i.model ? ` (${i.model})` : ''}`).join('; '),
      o.total,
      `${o.paymentMethod} ${o.paymentStatus}`,
      o.status,
      o.partner?.name,
      o.trackingNumber,
    ]),
  ];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
  res.send(rows.map((r) => r.map(csvCell).join(',')).join('\n'));
});

adminRouter.get('/orders/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, events: { orderBy: { createdAt: 'asc' } }, partner: true, user: { select: { id: true, name: true, email: true } } },
  });
  if (!order) fail(404, 'Order not found.');
  res.json(order);
});

const STATUS_COPY: Record<string, string> = {
  CONFIRMED: 'has been confirmed',
  PACKED: 'is packed and ready to ship',
  SHIPPED: 'has been shipped',
  OUT_FOR_DELIVERY: 'is out for delivery today',
  DELIVERED: 'has been delivered',
  CANCELLED: 'has been cancelled',
  RETURNED: 'has been returned',
};

adminRouter.patch('/orders/:id', async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order) fail(404, 'Order not found.');
  const o = order!;
  const status = str(req.body.status);
  if (status && !(ORDER_STATUSES as readonly string[]).includes(status)) fail(400, 'Unknown status.');
  const data: Prisma.OrderUpdateInput = {};
  const ops: Prisma.PrismaPromise<unknown>[] = [];

  if (req.body.partnerId !== undefined) data.partner = req.body.partnerId ? { connect: { id: String(req.body.partnerId) } } : { disconnect: true };
  if (req.body.trackingNumber !== undefined) data.trackingNumber = str(req.body.trackingNumber) || null;
  if (req.body.paymentStatus) {
    if (!['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(str(req.body.paymentStatus))) fail(400, 'Unknown payment status.');
    data.paymentStatus = str(req.body.paymentStatus);
  }

  if (status && status !== o.status) {
    data.status = status;
    data.events = { create: { status, note: cleanText(req.body.note, 300) || null } };
    if (status === 'DELIVERED' && o.paymentMethod === 'COD') data.paymentStatus = 'PAID';
    const wasActive = !['CANCELLED', 'RETURNED'].includes(o.status);
    const nowInactive = ['CANCELLED', 'RETURNED'].includes(status);
    if (wasActive && nowInactive)
      o.items.filter((i) => i.productId).forEach((i) => ops.push(prisma.product.update({ where: { id: i.productId! }, data: { stock: { increment: i.qty } } })));
    if (!wasActive && !nowInactive) {
      // re-opening a cancelled order needs the stock back — refuse instead of going negative
      for (const i of o.items.filter((x) => x.productId)) {
        const p = await prisma.product.findUnique({ where: { id: i.productId! }, select: { stock: true, name: true } });
        if (p && p.stock < i.qty) fail(400, `Not enough stock to re-open: only ${p.stock} of "${p.name}" left.`);
      }
    }
    if (!wasActive && !nowInactive)
      o.items.filter((i) => i.productId).forEach((i) => ops.push(prisma.product.update({ where: { id: i.productId! }, data: { stock: { decrement: i.qty } } })));
  }
  const [updated] = await prisma.$transaction([prisma.order.update({ where: { id: o.id }, data, include: { partner: true } }), ...ops]);
  const u = updated as typeof o & { partner: { name: string; trackingUrl: string } | null };
  if (status && status !== o.status) {
    const track = u.partner && u.trackingNumber ? `<p>Courier: ${escapeHtml(u.partner.name)} · Tracking: ${escapeHtml(u.trackingNumber)}</p>` : '';
    sendMail(o.email, `Your order ${o.number} ${STATUS_COPY[status] || 'was updated'}`, `<p>Hi ${escapeHtml(o.customerName)}, your order ${STATUS_COPY[status] || 'was updated'}.</p>${track}`);
  }
  res.json(updated);
});

/* ---------- customers ---------- */
adminRouter.get('/customers', async (req, res) => {
  const q = str(req.query.q);
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER', ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}) },
    orderBy: { createdAt: 'desc' },
    include: { orders: { select: { total: true, status: true, createdAt: true } }, addresses: { where: { isDefault: true }, take: 1 } },
  });
  res.json(
    users.map((u) => {
      const valid = u.orders.filter((o) => !['CANCELLED', 'RETURNED'].includes(o.status));
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        createdAt: u.createdAt,
        city: u.addresses[0]?.city,
        orders: u.orders.length,
        spent: valid.reduce((a, o) => a + o.total, 0),
        lastOrder: u.orders.map((o) => o.createdAt).sort((a, b) => +b - +a)[0] || null,
      };
    }),
  );
});

/* ---------- delivery partners ---------- */
adminRouter.get('/partners', async (_req, res) => {
  const partners = await prisma.deliveryPartner.findMany({ orderBy: { createdAt: 'asc' }, include: { orders: { select: { status: true } } } });
  res.json(
    partners.map(({ orders, ...p }) => ({
      ...p,
      active_orders: orders.filter((o) => ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status)).length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    })),
  );
});
const partnerData = (b: Record<string, unknown>) => {
  const name = str(b.name);
  if (!name) fail(400, 'Partner name is required.');
  return { name, contactPerson: str(b.contactPerson) || null, phone: str(b.phone) || null, trackingUrl: str(b.trackingUrl), codSupported: b.codSupported !== false, active: b.active !== false };
};
adminRouter.post('/partners', async (req, res) => {
  res.json(await prisma.deliveryPartner.create({ data: partnerData(req.body) }));
});
adminRouter.put('/partners/:id', async (req, res) => {
  res.json(await prisma.deliveryPartner.update({ where: { id: req.params.id }, data: partnerData(req.body) }));
});
adminRouter.delete('/partners/:id', async (req, res) => {
  await prisma.deliveryPartner.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* ---------- coupons ---------- */
adminRouter.get('/coupons', async (_req, res) => {
  res.json(await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }));
});
const couponData = (b: Record<string, unknown>) => {
  const code = str(b.code).toUpperCase().replace(/\s/g, '');
  if (!code) fail(400, 'Coupon code is required.');
  const value = int(b.value);
  if (value <= 0) fail(400, 'Discount value must be more than 0.');
  return {
    code,
    type: b.type === 'FLAT' ? 'FLAT' : 'PERCENT',
    value,
    minOrder: int(b.minOrder),
    maxDiscount: int(b.maxDiscount) || null,
    active: b.active !== false,
    expiresAt: str(b.expiresAt) ? new Date(str(b.expiresAt)) : null,
    usageLimit: int(b.usageLimit) > 0 ? int(b.usageLimit) : null,
  };
};
adminRouter.post('/coupons', async (req, res) => {
  res.json(await prisma.coupon.create({ data: couponData(req.body) }));
});
adminRouter.put('/coupons/:id', async (req, res) => {
  res.json(await prisma.coupon.update({ where: { id: req.params.id }, data: couponData(req.body) }));
});
adminRouter.delete('/coupons/:id', async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* ---------- reviews ---------- */
adminRouter.get('/reviews', async (_req, res) => {
  res.json(await prisma.review.findMany({ orderBy: { createdAt: 'desc' }, include: { product: { select: { name: true, slug: true } } } }));
});
adminRouter.patch('/reviews/:id', async (req, res) => {
  const r = await prisma.review.update({ where: { id: req.params.id }, data: { approved: !!req.body.approved } });
  await recalcRating(r.productId);
  res.json(r);
});
adminRouter.delete('/reviews/:id', async (req, res) => {
  const r = await prisma.review.delete({ where: { id: req.params.id } });
  await recalcRating(r.productId);
  res.json({ ok: true });
});

/* ---------- inbox ---------- */
adminRouter.get('/messages', async (_req, res) => {
  res.json(await prisma.message.findMany({ orderBy: { createdAt: 'desc' } }));
});
adminRouter.patch('/messages/:id', async (req, res) => {
  res.json(await prisma.message.update({ where: { id: req.params.id }, data: { read: !!req.body.read } }));
});
adminRouter.delete('/messages/:id', async (req, res) => {
  await prisma.message.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
adminRouter.get('/subscribers', async (_req, res) => {
  res.json(await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } }));
});

/* ---------- settings ---------- */
adminRouter.get('/settings', async (_req, res) => {
  res.json(await getSettings());
});
adminRouter.put('/settings', async (req, res) => {
  const keys = Object.keys(DEFAULT_SETTINGS);
  await prisma.$transaction(
    Object.entries(req.body as Record<string, unknown>)
      .filter(([k]) => keys.includes(k))
      .map(([key, v]) => prisma.setting.upsert({ where: { key }, update: { value: String(v) }, create: { key, value: String(v) } })),
  );
  res.json(await getSettings());
});
