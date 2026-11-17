import bcrypt from 'bcryptjs';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../../config/env';
import { COOKIE_NAME, cookieOptions, requireAuth, signToken } from '../../middleware/auth';
import { HttpError } from '../../utils/http-error';
import { User } from './user.model';

const loginBody = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(200),
});

// Slows down credential stuffing. Per IP; use a shared store (Redis) when running >1 instance.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, _res, next) => next(new HttpError(429, 'TOO_MANY_REQUESTS', 'Too many attempts, try again later')),
});

// Compared against when the email is unknown, so both failure paths cost one bcrypt round (no timing oracle).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export const authRouter = Router();

authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = loginBody.parse(req.body);
  const user = await User.findOne({ email }).select('+password');
  const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  res.cookie(COOKIE_NAME, signToken({ id: user.id, role: user.role }), {
    ...cookieOptions,
    maxAge: env.JWT_EXPIRES_IN_HOURS * 3_600_000,
  });
  res.json({ data: user });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions).status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    res.clearCookie(COOKIE_NAME, cookieOptions); // account removed while the token was still valid
    throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in');
  }
  res.json({ data: user });
});
