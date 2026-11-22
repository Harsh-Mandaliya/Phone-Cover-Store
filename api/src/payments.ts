/* Online payments (Razorpay) — secure by design, OFF until keys are set in api/.env:
 *   RAZORPAY_KEY_ID=rzp_test_xxx  RAZORPAY_KEY_SECRET=xxx  RAZORPAY_WEBHOOK_SECRET=xxx
 * Test-mode keys are free from the Razorpay dashboard.
 *
 * Rules this module enforces (the classic ways stores get cheated):
 *  1. The amount is always computed on the server from the database — never from the browser.
 *  2. The gateway order is created by the server and stored on our order; a payment only counts
 *     if it belongs to *that* gateway order.
 *  3. The checkout callback's signature is verified with HMAC-SHA256 + constant-time compare.
 *  4. We then ask Razorpay directly for the payment and check status, amount, currency and order id.
 *  5. A payment id is UNIQUE in our DB, so one real payment can never mark two orders as paid.
 *  6. The webhook is verified with its own secret over the raw body (backup if the browser closes).
 *  7. Unpaid online orders release their stock after 30 minutes. */
import crypto from 'crypto';

export const razorpay = {
  keyId: () => process.env.RAZORPAY_KEY_ID || '',
  secret: () => process.env.RAZORPAY_KEY_SECRET || '',
  webhookSecret: () => process.env.RAZORPAY_WEBHOOK_SECRET || '',
  enabled: () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
};

export type GatewayPayment = { id: string; order_id: string; amount: number; currency: string; status: string };

/** Network calls live behind this object so tests can swap in a fake gateway. */
export const gateway = {
  async createOrder(amountPaise: number, receipt: string): Promise<{ id: string; amount: number; currency: string }> {
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: basicAuth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, payment_capture: 1 }),
    });
    if (!r.ok) throw new Error(`Razorpay order failed: ${r.status}`);
    return r.json();
  },
  async fetchPayment(paymentId: string): Promise<GatewayPayment> {
    const r = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: basicAuth() } });
    if (!r.ok) throw new Error(`Razorpay payment lookup failed: ${r.status}`);
    return r.json();
  },
};
const basicAuth = () => 'Basic ' + Buffer.from(`${razorpay.keyId()}:${razorpay.secret()}`).toString('base64');

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a, 'utf8');
  const y = Buffer.from(b, 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const hmac = (secret: string, data: string | Buffer) => crypto.createHmac('sha256', secret).update(data).digest('hex');

/** Signature Razorpay Checkout returns: HMAC(order_id + "|" + payment_id, key_secret). */
export const verifyCheckoutSignature = (gatewayOrderId: string, paymentId: string, signature: string) =>
  !!razorpay.secret() && typeof signature === 'string' && safeEqual(hmac(razorpay.secret(), `${gatewayOrderId}|${paymentId}`), signature);

/** Webhook signature: HMAC(raw request body, webhook secret). */
export const verifyWebhookSignature = (rawBody: Buffer, signature: string | undefined) =>
  !!razorpay.webhookSecret() && !!signature && safeEqual(hmac(razorpay.webhookSecret(), rawBody), signature);

/** Used by tests and docs: produce the signature Razorpay would send. */
export const signForTest = (gatewayOrderId: string, paymentId: string) => hmac(razorpay.secret(), `${gatewayOrderId}|${paymentId}`);
export const signWebhookForTest = (raw: Buffer) => hmac(razorpay.webhookSecret(), raw);
