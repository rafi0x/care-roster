import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { requireAuth, requireRole } from './middleware/auth';
import type { RequestHandler } from 'express';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authRouter } from './modules/auth/auth.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { doctorRouter } from './modules/doctors/doctor.routes';
import { patientRouter } from './modules/patients/patient.routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // behind the Next.js rewrite / a load balancer
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRouter);

  // Signed-in users can read everything; only admins can change data (staff = read-only).
  const readOnlyForStaff: RequestHandler = (req, res, next) =>
    req.method === 'GET' || req.method === 'HEAD' ? next() : requireRole('admin')(req, res, next);
  const protect = [requireAuth, readOnlyForStaff];
  app.use('/api/doctors', protect, doctorRouter);
  app.use('/api/patients', protect, patientRouter);
  app.use('/api/dashboard', protect, dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
