import type { CookieOptions, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '../modules/auth/user.model';
import { HttpError } from '../utils/http-error';

export const COOKIE_NAME = 'token';

export const cookieOptions: CookieOptions = {
  httpOnly: true, // not readable from JS -> XSS cannot steal the session
  sameSite: 'lax', // not sent on cross-site POSTs -> CSRF protection
  secure: env.NODE_ENV === 'production',
  path: '/',
};

export interface AuthUser {
  id: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export const signToken = (user: AuthUser) =>
  jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: `${env.JWT_EXPIRES_IN_HOURS}h` });

/** Authentication: a valid session cookie is required. */
export const requireAuth: RequestHandler = (req, res, next) => {
  try {
    const payload = jwt.verify(req.cookies?.[COOKIE_NAME] ?? '', env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !payload.sub) throw new Error('bad payload');
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    // Drop an expired/forged cookie so the client stops treating it as a session.
    if (req.cookies?.[COOKIE_NAME]) res.clearCookie(COOKIE_NAME, cookieOptions);
    next(new HttpError(401, 'UNAUTHENTICATED', 'Please sign in'));
  }
};

/** Authorization: the signed-in user must hold one of the given roles. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) =>
    req.user && roles.includes(req.user.role)
      ? next()
      : next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to do that'));
