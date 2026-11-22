import 'dotenv/config';
import { createApp } from './app';
import { sweepUnpaid } from './routes/store';
import { razorpay } from './payments';

const port = Number(process.env.API_PORT || 4000);
createApp().listen(port, () => {
  console.log(`🛡  All Is Well API running on http://localhost:${port}`);
  console.log(`   Online payments: ${razorpay.enabled() ? 'Razorpay ON' : 'off (Cash on Delivery only)'}`);
});

// every 5 minutes: cancel online orders that were never paid and release their stock
setInterval(() => sweepUnpaid().catch((e) => console.error('sweep failed', e)), 5 * 60_000).unref();
