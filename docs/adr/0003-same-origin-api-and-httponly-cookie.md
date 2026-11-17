# ADR 0003: Same-origin API via Next.js rewrite and an httpOnly JWT cookie

- Status: Accepted
- Scope: `client/next.config.ts`, `client/src/lib/api.ts`, `server/src/middleware/auth.ts`, `server/src/modules/auth/auth.routes.ts`

## Context

The client and API are separate applications. The session must not be readable by page JavaScript (XSS), and cross-site requests must not carry it (CSRF), without adding a separate CSRF token mechanism.

## Decision

- The browser calls only the Next.js origin. A rewrite maps `/api/:path*` to `${API_URL}/api/:path*`.
- Login sets a JWT (HS256, `sub` = user id, `role` claim, lifetime `JWT_EXPIRES_IN_HOURS`, default 8) in a cookie named `token` with `httpOnly`, `SameSite=Lax`, `Secure` in production, `path=/`, and a matching `maxAge`.
- `requireAuth` verifies the cookie on every protected request. An invalid or expired cookie is cleared and the API answers 401 `UNAUTHENTICATED`.
- The client uses `credentials: 'include'`, never stores a token, and on a 401 (outside `/auth/*`) navigates to `/login?next=...`.
- `proxy.ts` redirects cookie-less page visits to `/login`; it only checks that a cookie exists and is not a security control.

## Consequences

- The cookie is first-party, so `SameSite=Lax` works (no `SameSite=None`) and CORS preflights do not happen. `cors` is still configured for `CLIENT_ORIGIN` for direct API use.
- JavaScript cannot read the token. `Lax` blocks the cookie on cross-site POST/PATCH/DELETE; there is no separate CSRF token. Top-level cross-site GETs do carry it, which is safe because GET handlers have no side effects.
- One extra network hop through the Next.js server for every API call.
- The API's `trust proxy` is `1`, assuming exactly one proxy hop in front.
- Stateless JWT: no server-side revocation, no refresh token (see trade-offs).

## Alternatives considered

- Browser calls the API cross-origin with `SameSite=None; Secure`: needs CORS preflights, weaker CSRF posture, third-party-cookie issues.
- JWT in `localStorage` with an `Authorization` header: readable by any XSS, no cookie needed.
- Server-side sessions in MongoDB/Redis: revocable, but adds a session store and a lookup per request.
