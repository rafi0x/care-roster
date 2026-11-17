# ADR 0005: Staff read-only role enforced server-side

- Status: Accepted
- Scope: `server/src/app.ts`, `server/src/middleware/auth.ts`, `server/src/modules/auth/user.model.ts`

## Context

Some portal users should look but not change data. Hiding buttons in the UI is not protection: anyone with a valid cookie can call the API directly.

## Decision

Two roles, `admin` and `staff` (default). The API applies one rule at the mount point of `/api/doctors`, `/api/patients` and `/api/dashboard`: `requireAuth`, then `readOnlyForStaff` (GET and HEAD pass for any signed-in user, every other method requires `requireRole('admin')`), then `invalidateOnWrite`. The role is a claim in the JWT. The client hides write controls via `useCanWrite`, as a courtesy.

## Consequences

- Safe by default: a new non-GET route under those prefixes is admin-only without extra code. A new read-only POST (for example a search endpoint) would be blocked for staff and need an explicit exception.
- Staff get 403 `FORBIDDEN` on writes; unauthenticated callers get 401.
- The role comes from the token, not the database, so promoting or demoting a user takes effect only after they sign in again (up to the token lifetime).
- Only two coarse roles; no per-doctor or per-hospital scoping.
- `/api/auth/*` and `/api/health` are outside this gate.

## Alternatives considered

- Per-route `requireRole` calls: explicit, but easy to forget on a new route.
- UI-only restriction: not a security control.
- Permission-based RBAC (per resource and action): more than the two use cases need.
