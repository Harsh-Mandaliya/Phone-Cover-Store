import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { HttpError, requireAdmin } from './lib';
import { securityHeaders } from './security';
import { verifyWebhookSignature } from './payments';
import { authRouter } from './routes/auth';
import { markPaid, storeRouter } from './routes/store';
import { adminRouter } from './routes/admin';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // behind a hosting proxy (Render/Railway/Nginx) the real client IP is in X-Forwarded-For
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

  app.use(securityHeaders);
  app.use(cors({ origin: (process.env.WEB_URL || 'http://localhost:3000').split(','), credentials: true }));

  // Razorpay webhook needs the *raw* body to verify its signature, so it is mounted before express.json().
  app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '256kb' }), async (req, res) => {
    const raw = req.body as Buffer;
    if (!Buffer.isBuffer(raw) || !verifyWebhookSignature(raw, req.header('x-razorpay-signature'))) return res.status(400).json({ error: 'Invalid signature' });
    try {
      const event = JSON.parse(raw.toString('utf8'));
      if (event.event === 'payment.captured' || event.event === 'order.paid') {
        const p = event.payload?.payment?.entity;
        if (p?.order_id && p?.id) await markPaid(p.order_id, p.id).catch((e) => console.warn('webhook:', (e as Error).message));
      }
      res.json({ ok: true }); // always 200 for a valid signature so Razorpay stops retrying
    } catch {
      res.status(400).json({ error: 'Bad payload' });
    }
  });

  app.use(express.json({ limit: '100kb' }));
  app.use(
    '/uploads',
    express.static(path.join(__dirname, '..', 'uploads'), {
      maxAge: '7d',
      dotfiles: 'deny',
      setHeaders: (res) => res.setHeader('Content-Disposition', 'inline'),
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/admin', requireAdmin, adminRouter);
  app.use('/api', storeRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    const e = err as { type?: string; status?: number };
    if (e?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    if (e?.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
    if ((err as { code?: string })?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Image must be under 5 MB.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' }); // never leak stack traces
  });
  return app;
}
