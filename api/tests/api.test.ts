import './setup';
import { after, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib';
import { resetRateLimits } from '../src/security';
import { gateway, signForTest, signWebhookForTest, type GatewayPayment } from '../src/payments';
import { sweepUnpaid } from '../src/routes/store';

const app = createApp();
const api = () => request(app);
beforeEach(() => resetRateLimits());
after(() => prisma.$disconnect());

/* ---------- fake Razorpay: records orders, lets each test decide what a payment looks like ---------- */
const payments = new Map<string, GatewayPayment>();
let gOrderSeq = 0;
gateway.createOrder = async (amount) => ({ id: `order_test_${++gOrderSeq}`, amount, currency: 'INR' });
gateway.fetchPayment = async (id) => {
  const p = payments.get(id);
  if (!p) throw new Error('unknown payment');
  return p;
};

/* ---------- helpers ---------- */
const customer = { name: 'Test Buyer', email: 'buyer@example.com', phone: '9876543210' };
const address = { line1: '1 Test Road', city: 'Delhi', state: 'Delhi', pincode: '110001' };
async function universalProduct(minStock = 3) {
  const p = await prisma.product.findFirst({ where: { models: '[]', status: 'PUBLISHED', stock: { gte: minStock } } });
  assert.ok(p, 'need a universal product in seed');
  return p!;
}
const order = (items: unknown[], extra: Record<string, unknown> = {}) => api().post('/api/orders').send({ customer, address, items, paymentMethod: 'COD', ...extra });
async function token(email: string, password: string) {
  const r = await api().post('/api/auth/login').send({ email, password });
  assert.equal(r.status, 200, r.body.error);
  return r.body.token as string;
}
const adminToken = () => token('admin@alliswell.local', 'Admin@123');

/* ======================================================================== */
describe('security headers', () => {
  test('sends hardening headers and hides Express', async () => {
    const r = await api().get('/api/health');
    assert.equal(r.headers['x-content-type-options'], 'nosniff');
    assert.equal(r.headers['x-frame-options'], 'DENY');
    assert.equal(r.headers['x-powered-by'], undefined);
  });
  test('bad JSON gives a clean 400, not a stack trace', async () => {
    const r = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    assert.equal(r.status, 400);
    assert.doesNotMatch(JSON.stringify(r.body), /at .*\.ts/);
  });
});

describe('authentication', () => {
  test('rejects weak passwords', async () => {
    const r = await api().post('/api/auth/register').send({ name: 'Weak', email: 'weak@example.com', password: '12345678' });
    assert.equal(r.status, 400);
  });
  test('cannot register yourself as ADMIN', async () => {
    const r = await api().post('/api/auth/register').send({ name: 'Mallory', email: 'mallory@example.com', password: 'Str0ng-pass!', role: 'ADMIN' });
    assert.equal(r.status, 200);
    assert.equal(r.body.user.role, 'CUSTOMER');
    const s = await api().get('/api/admin/stats').set('Authorization', `Bearer ${r.body.token}`);
    assert.equal(s.status, 403);
  });
  test('wrong password is refused; brute force is rate-limited', async () => {
    let last = 0;
    for (let i = 0; i < 12; i++) last = (await api().post('/api/auth/login').send({ email: 'admin@alliswell.local', password: `guess${i}` })).status;
    assert.equal(last, 429);
  });
  test('forged "alg: none" admin token is rejected', async () => {
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const forged = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ id: 'x', role: 'ADMIN', email: 'a', name: 'a' })}.`;
    const r = await api().get('/api/admin/stats').set('Authorization', `Bearer ${forged}`);
    assert.equal(r.status, 401);
  });
  test('a demoted admin loses access immediately, even with an old token', async () => {
    const reg = await api().post('/api/auth/register').send({ name: 'Temp Admin', email: 'temp-admin@example.com', password: 'Str0ng-pass!' });
    await prisma.user.update({ where: { id: reg.body.user.id }, data: { role: 'ADMIN' } });
    const t = await token('temp-admin@example.com', 'Str0ng-pass!');
    assert.equal((await api().get('/api/admin/stats').set('Authorization', `Bearer ${t}`)).status, 200);
    await prisma.user.update({ where: { id: reg.body.user.id }, data: { role: 'CUSTOMER' } });
    assert.equal((await api().get('/api/admin/stats').set('Authorization', `Bearer ${t}`)).status, 403);
  });
});

describe('checkout cannot be cheated', () => {
  test('client-sent price, total and paymentStatus are ignored', async () => {
    const p = await universalProduct();
    const r = await order([{ productId: p.id, qty: 1, price: 1 }], { total: 1, paymentStatus: 'PAID', discount: 99999 });
    assert.equal(r.status, 200, r.body.error);
    const o = await prisma.order.findUnique({ where: { number: r.body.number } });
    assert.equal(o!.subtotal, p.price);
    assert.equal(o!.paymentStatus, 'PENDING');
    assert.equal(o!.discount, 0);
  });
  test('negative / huge quantities are clamped and capped', async () => {
    const p = await universalProduct(12);
    const r = await order([{ productId: p.id, qty: -5 }]);
    const o = await prisma.order.findUnique({ where: { number: r.body.number }, include: { items: true } });
    assert.equal(o!.items[0].qty, 1);
    const many = await order(Array.from({ length: 4 }, () => ({ productId: p.id, qty: 10 })));
    assert.equal(many.status, 400); // > 30 units
  });
  test('a case needs a phone model, and the model must fit', async () => {
    const c = await prisma.product.findFirst({ where: { slug: 'armour-pro-magsafe-case' } });
    assert.equal((await order([{ productId: c!.id, qty: 1 }])).status, 400);
    assert.equal((await order([{ productId: c!.id, qty: 1, model: 'Nokia 3310' }])).status, 400);
    assert.equal((await order([{ productId: c!.id, qty: 1, model: 'iPhone 17 Pro' }])).status, 200);
  });
  test('two buyers racing for the last piece: only one wins, stock never goes negative', async () => {
    const p = await universalProduct();
    await prisma.product.update({ where: { id: p.id }, data: { stock: 1 } });
    const [a, b] = await Promise.all([order([{ productId: p.id, qty: 1 }]), order([{ productId: p.id, qty: 1 }])]);
    assert.deepEqual([a.status, b.status].sort(), [200, 400]);
    assert.equal((await prisma.product.findUnique({ where: { id: p.id } }))!.stock, 0);
    await prisma.product.update({ where: { id: p.id }, data: { stock: 50 } });
  });
  test('coupon usage limit holds', async () => {
    const p = await universalProduct();
    await prisma.coupon.create({ data: { code: 'ONCE', type: 'FLAT', value: 50, usageLimit: 1 } });
    assert.equal((await order([{ productId: p.id, qty: 1 }], { couponCode: 'ONCE' })).status, 200);
    assert.equal((await order([{ productId: p.id, qty: 1 }], { couponCode: 'ONCE' })).status, 400);
  });
  test('HTML in names is stripped (no stored XSS)', async () => {
    const p = await universalProduct();
    const r = await api().post('/api/orders').send({ customer: { ...customer, name: '<img src=x onerror=alert(1)>Eve' }, address, items: [{ productId: p.id, qty: 1 }] });
    const o = await prisma.order.findUnique({ where: { number: r.body.number } });
    assert.doesNotMatch(o!.customerName, /[<>]/);
  });
});

describe('online payments (fake Razorpay)', () => {
  async function onlineOrder() {
    const p = await universalProduct();
    const r = await order([{ productId: p.id, qty: 1 }], { paymentMethod: 'ONLINE' });
    assert.equal(r.status, 200, r.body.error);
    assert.ok(r.body.payment.gatewayOrderId);
    return { number: r.body.number as string, gOrder: r.body.payment.gatewayOrderId as string, amount: r.body.payment.amount as number, product: p };
  }
  const verify = (body: object) => api().post('/api/payments/verify').send(body);

  test('order waits for payment and is not "paid" yet', async () => {
    const { number } = await onlineOrder();
    const o = await prisma.order.findUnique({ where: { number } });
    assert.equal(o!.status, 'PENDING_PAYMENT');
    assert.equal(o!.paymentStatus, 'PENDING');
  });
  test('forged signature is rejected', async () => {
    const { number, gOrder, amount } = await onlineOrder();
    payments.set('pay_forged', { id: 'pay_forged', order_id: gOrder, amount, currency: 'INR', status: 'captured' });
    const r = await verify({ number, razorpay_order_id: gOrder, razorpay_payment_id: 'pay_forged', razorpay_signature: 'deadbeef' });
    assert.equal(r.status, 400);
  });
  test('valid signature but underpaid amount is rejected', async () => {
    const { number, gOrder } = await onlineOrder();
    payments.set('pay_cheap', { id: 'pay_cheap', order_id: gOrder, amount: 100, currency: 'INR', status: 'captured' });
    const r = await verify({ number, razorpay_order_id: gOrder, razorpay_payment_id: 'pay_cheap', razorpay_signature: signForTest(gOrder, 'pay_cheap') });
    assert.equal(r.status, 400);
    assert.match(r.body.error, /amount/i);
  });
  test('genuine payment marks the order paid — and is idempotent', async () => {
    const { number, gOrder, amount } = await onlineOrder();
    payments.set('pay_ok', { id: 'pay_ok', order_id: gOrder, amount, currency: 'INR', status: 'captured' });
    const body = { number, razorpay_order_id: gOrder, razorpay_payment_id: 'pay_ok', razorpay_signature: signForTest(gOrder, 'pay_ok') };
    assert.equal((await verify(body)).status, 200);
    assert.equal((await verify(body)).status, 200);
    const o = await prisma.order.findUnique({ where: { number } });
    assert.equal(o!.paymentStatus, 'PAID');
    assert.equal(o!.status, 'PLACED');
  });
  test('one real payment cannot be replayed to pay a second order', async () => {
    const second = await onlineOrder();
    const r = await verify({ number: second.number, razorpay_order_id: second.gOrder, razorpay_payment_id: 'pay_ok', razorpay_signature: signForTest(second.gOrder, 'pay_ok') });
    assert.notEqual(r.status, 200);
    assert.equal((await prisma.order.findUnique({ where: { number: second.number } }))!.paymentStatus, 'PENDING');
  });
  test('webhook: bad signature refused, good one marks paid', async () => {
    const { number, gOrder, amount } = await onlineOrder();
    payments.set('pay_hook', { id: 'pay_hook', order_id: gOrder, amount, currency: 'INR', status: 'captured' });
    const raw = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_hook', order_id: gOrder } } } }));
    const bad = await api().post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', 'nope').send(raw.toString('utf8'));
    assert.equal(bad.status, 400);
    const ok = await api().post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-razorpay-signature', signWebhookForTest(raw)).send(raw.toString('utf8'));
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal((await prisma.order.findUnique({ where: { number } }))!.paymentStatus, 'PAID');
  });
  test('abandoned online orders give their stock back', async () => {
    const { number, product } = await onlineOrder();
    const before = (await prisma.product.findUnique({ where: { id: product.id } }))!.stock;
    await prisma.order.update({ where: { number }, data: { createdAt: new Date(Date.now() - 60 * 60_000) } });
    assert.ok((await sweepUnpaid()) >= 1);
    assert.equal((await prisma.product.findUnique({ where: { id: product.id } }))!.stock, before + 1);
    assert.equal((await prisma.order.findUnique({ where: { number } }))!.status, 'CANCELLED');
  });
});

describe('order privacy', () => {
  test('lookup needs the matching phone and is rate-limited', async () => {
    const p = await universalProduct();
    const { body } = await order([{ productId: p.id, qty: 1 }]);
    assert.equal((await api().get(`/api/orders/${body.number}?phone=9000000000`)).status, 404);
    const okr = await api().get(`/api/orders/${body.number}?phone=${customer.phone}`);
    assert.equal(okr.status, 200);
    assert.equal(okr.body.gatewayOrderId, undefined);
    let last = 0;
    for (let i = 0; i < 25; i++) last = (await api().get(`/api/orders/KV000000${i}?phone=9000000000`)).status;
    assert.equal(last, 429);
  });
});

describe('reviews', () => {
  test('guest reviews wait for approval and do not change the rating', async () => {
    const p = await universalProduct();
    const before = (await prisma.product.findUnique({ where: { id: p.id } }))!.rating;
    const r = await api().post(`/api/products/${p.id}/reviews`).send({ name: 'Bot', rating: 1, comment: 'fake bad review' });
    assert.equal(r.body.pending, true);
    assert.equal((await prisma.product.findUnique({ where: { id: p.id } }))!.rating, before);
  });
});

describe('admin', () => {
  test('customers cannot reach admin routes', async () => {
    const t = await token('riya@example.com', 'customer123');
    assert.equal((await api().get('/api/admin/orders').set('Authorization', `Bearer ${t}`)).status, 403);
    assert.equal((await api().get('/api/admin/orders')).status, 401);
  });
  test('CSV export neutralises spreadsheet formulas', async () => {
    const p = await universalProduct();
    await api().post('/api/orders').send({ customer: { ...customer, name: '=HYPERLINK("http://evil")' }, address, items: [{ productId: p.id, qty: 1 }] });
    const csv = await api().get('/api/admin/orders.csv').set('Authorization', `Bearer ${await adminToken()}`);
    assert.equal(csv.status, 200);
    assert.match(csv.text, /"'=HYPERLINK/);
    assert.doesNotMatch(csv.text, /(^|,)"=HYPERLINK/m);
  });
  test('uploads: name tricks get a safe extension, non-images are refused', async () => {
    const t = await adminToken();
    const png = Buffer.from('89504e470d0a1a0a', 'hex');
    const ok = await api().post('/api/admin/upload').set('Authorization', `Bearer ${t}`).attach('file', png, { filename: 'evil.html', contentType: 'image/png' });
    assert.equal(ok.status, 200);
    assert.match(ok.body.url, /\.png$/);
    const bad = await api().post('/api/admin/upload').set('Authorization', `Bearer ${t}`).attach('file', Buffer.from('<script>'), { filename: 'x.svg', contentType: 'image/svg+xml' });
    assert.equal(bad.status, 400);
  });
  test('admin status flow: confirm → ship with partner; cancel restocks', async () => {
    const t = await adminToken();
    const p = await universalProduct();
    const { body } = await order([{ productId: p.id, qty: 2 }]);
    const o = await prisma.order.findUnique({ where: { number: body.number } });
    const stock = (await prisma.product.findUnique({ where: { id: p.id } }))!.stock;
    const partner = await prisma.deliveryPartner.findFirst();
    const patch = (b: object) => api().patch(`/api/admin/orders/${o!.id}`).set('Authorization', `Bearer ${t}`).send(b);
    assert.equal((await patch({ status: 'CONFIRMED' })).body.status, 'CONFIRMED');
    assert.equal((await patch({ status: 'SHIPPED', partnerId: partner!.id, trackingNumber: 'AWB1' })).body.status, 'SHIPPED');
    await patch({ status: 'CANCELLED' });
    assert.equal((await prisma.product.findUnique({ where: { id: p.id } }))!.stock, stock + 2);
    assert.equal((await patch({ paymentStatus: 'HACKED' })).status, 400);
  });
});
