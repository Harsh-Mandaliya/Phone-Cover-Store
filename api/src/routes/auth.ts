import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { fail, prisma, publicUser, requireAuth, signToken, str } from '../lib';
import { cleanText, rateLimit } from '../security';

// 10 tries per 15 min per IP+email, plus 50 per IP overall (stops password guessing)
const loginLimit = [
  rateLimit({ name: 'login-ip', max: 50, windowMs: 15 * 60_000 }),
  rateLimit({ name: 'login', max: 10, windowMs: 15 * 60_000, key: (r) => str(r.body?.email).toLowerCase() }),
];
const registerLimit = rateLimit({ name: 'register', max: 5, windowMs: 60 * 60_000 });
const DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy', 10);

export const authRouter = Router();

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

authRouter.post('/register', registerLimit, async (req, res) => {
  const name = cleanText(req.body?.name, 80);
  const email = cleanText(req.body?.email, 120).toLowerCase();
  const password = String(req.body?.password || '');
  const phone = str(req.body?.phone).replace(/\D/g, '').slice(-10) || null;
  if (name.length < 2) fail(400, 'Please enter your name.');
  if (!emailOk(email)) fail(400, 'Please enter a valid email.');
  if (password.length < 8 || password.length > 128) fail(400, 'Password must be 8 to 128 characters.');
  if (/^(.)\1+$/.test(password) || ['password', '12345678', 'qwerty123'].includes(password.toLowerCase())) fail(400, 'Please choose a less common password.');
  if (await prisma.user.findUnique({ where: { email } })) fail(409, 'An account with this email already exists.');
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash: await bcrypt.hash(password, 10) },
  });
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.post('/login', ...loginLimit, async (req, res) => {
  const email = str(req.body?.email).toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // always run bcrypt so response time does not reveal whether the email exists
  const ok = await bcrypt.compare(String(req.body?.password || '').slice(0, 128), user?.passwordHash || DUMMY_HASH);
  if (!user || !ok) fail(401, 'Email or password is incorrect.');
  res.json({ token: signToken(user!), user: publicUser(user!) });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { addresses: { orderBy: { isDefault: 'desc' } } },
  });
  if (!user) fail(401, 'Session expired.');
  res.json({ user: publicUser(user!), addresses: user!.addresses });
});

authRouter.put('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name: cleanText(req.body?.name, 80) || undefined, phone: str(req.body?.phone).replace(/\D/g, '').slice(-10) || null },
  });
  res.json({ user: publicUser(user) });
});

authRouter.post('/addresses', requireAuth, async (req, res) => {
  const b = req.body;
  const data = {
    fullName: cleanText(b.fullName, 80),
    phone: str(b.phone).replace(/\D/g, '').slice(-10),
    line1: cleanText(b.line1, 160),
    line2: cleanText(b.line2, 160) || null,
    city: cleanText(b.city, 60),
    state: cleanText(b.state, 60),
    pincode: str(b.pincode),
  };
  if (!data.fullName || !data.line1 || !data.city || !/^\d{6}$/.test(data.pincode)) fail(400, 'Please complete the address.');
  const count = await prisma.address.count({ where: { userId: req.user!.id } });
  if (count >= 10) fail(400, 'You can save up to 10 addresses.');
  const address = await prisma.address.create({ data: { ...data, userId: req.user!.id, isDefault: count === 0 } });
  res.json({ address });
});

authRouter.delete('/addresses/:id', requireAuth, async (req, res) => {
  await prisma.address.deleteMany({ where: { id: String(req.params.id), userId: req.user!.id } });
  res.json({ ok: true });
});
