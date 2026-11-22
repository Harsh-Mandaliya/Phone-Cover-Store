/* Test bootstrap: a throwaway SQLite file (tests/test.db), demo seed data and a fake payment gateway.
 * Import this BEFORE anything that touches Prisma. Your real store.db is never touched. */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');
const dbFile = path.join(__dirname, 'test.db');
const env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: 'file:../tests/test.db', // relative to prisma/schema.prisma
  JWT_SECRET: 'test-secret-that-is-definitely-longer-than-32-chars',
  RAZORPAY_KEY_ID: 'rzp_test_fake',
  RAZORPAY_KEY_SECRET: 'fake_key_secret',
  RAZORPAY_WEBHOOK_SECRET: 'fake_webhook_secret',
};
Object.assign(process.env, env);

for (const f of [dbFile, `${dbFile}-journal`]) if (fs.existsSync(f)) fs.rmSync(f); // our own throwaway file
execSync('npx prisma db push --skip-generate', { cwd: root, env, stdio: 'ignore' });
execSync('npx tsx prisma/seed.ts', { cwd: root, env, stdio: 'ignore' });
