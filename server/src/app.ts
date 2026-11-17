import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from './config/env';
import { requireAuth, requireRole } from './middleware/auth';
import type { RequestHandler } from 'express';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authRouter } from './modules/auth/auth.routes';
import { dashboardRouter, invalidateDashboard } from './modules/dashboard/dashboard.routes';
import { doctorRouter } from './modules/doctors/doctor.routes';
import { patientRouter } from './modules/patients/patient.routes';
import { HttpError } from './utils/http-error';

/** `globalLimit` (requests/min/IP) is injectable so tests can exercise the limiter; it is off under NODE_ENV=test unless given. */
export function createApp({ globalLimit }: { globalLimit?: number } = {}) {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY); // behind the Next.js rewrite and/or a reverse proxy
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // Readiness: 200 only while the database answers (load balancers stop routing to a node that lost it).
  app.get('/api/health', async (_req, res) => {
    const db = mongoose.connection.readyState === 1 ? await mongoose.connection.db!.admin().ping().then(() => true, () => false) : false;
    res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'unavailable' });
  });

  // Generous per-IP ceiling on everything below (health stays exempt). Use a shared store (Redis) when running >1 instance.
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: globalLimit ?? 300,
      standardHeaders: true,
      legacyHeaders: false,
      skip: () => env.NODE_ENV === 'test' && globalLimit === undefined,
      handler: (_req, _res, next) => next(new HttpError(429, 'TOO_MANY_REQUESTS', 'Too many requests, slow down')),
    }),
  );
  app.use('/api/auth', authRouter);

  // Signed-in users can read everything; only admins can change data (staff = read-only).
  const readOnlyForStaff: RequestHandler = (req, res, next) =>
    req.method === 'GET' || req.method === 'HEAD' ? next() : requireRole('admin')(req, res, next);
  // Any successful change makes the cached dashboard numbers stale.
  const invalidateOnWrite: RequestHandler = (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') res.on('finish', () => res.statusCode < 400 && invalidateDashboard());
    next();
  };
  const protect = [requireAuth, readOnlyForStaff, invalidateOnWrite];
  app.use('/api/doctors', protect, doctorRouter);
  app.use('/api/patients', protect, patientRouter);
  app.use('/api/dashboard', protect, dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
