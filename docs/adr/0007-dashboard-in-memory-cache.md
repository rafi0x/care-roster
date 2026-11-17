# ADR 0007: Dashboard in-memory cache with invalidate-on-write

- Status: Accepted
- Scope: `server/src/modules/dashboard/dashboard.routes.ts`, `invalidateOnWrite` in `server/src/app.ts`

## Context

`GET /api/dashboard/stats` runs eight parallel queries, several of which group over whole collections. The numbers change only when data changes, and every dashboard visit pays for them.

## Decision

Cache the serialized response body in a module-level `Map` keyed by the `days` parameter, with a 60 s TTL checked on read. `invalidateOnWrite` registers `res.on('finish')` for every non-GET/HEAD request on the protected prefixes and calls `invalidateDashboard()` (`cache.clear()`) when the response status is below 400. Totals use `estimatedDocumentCount()` (collection metadata).

## Consequences

- Repeat dashboard loads within 60 s with no writes cost no database work; after a write the next load recomputes.
- Single-process only. With N instances, a write clears only the instance that handled it; others serve data up to 60 s old. Writes outside the API (seed script, manual edits) are visible only after the TTL.
- `estimatedDocumentCount` can be inexact after an unclean shutdown or on sharded clusters.
- Dates are bucketed in UTC.
- A burst of writes keeps the cache cold; that is acceptable because the TTL only bounds staleness, it does not promise freshness.
- Upgrade path: Redis with a shared TTL and a pub/sub or key-prefix invalidation, or maintained counters.

## Alternatives considered

- No cache: always fresh; every visit runs eight queries.
- TTL only: simpler, but stale after the user's own write.
- Redis now: correct across instances, adds an infrastructure dependency for a single-instance deployment.
- Precomputed counters / materialised view: constant-time reads, more write-path complexity.
