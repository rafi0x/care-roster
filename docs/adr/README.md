# Architecture decision records

Each ADR uses the same sections: Status, Context, Decision, Consequences, Alternatives considered.

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-search-with-indexed-prefix-tokens.md) | Search with indexed prefix tokens (not `$regex` / `$text`) | Accepted |
| [0002](0002-index-design-and-stable-pagination.md) | Index design: equality, `createdAt`, `_id` tiebreaker | Accepted |
| [0003](0003-same-origin-api-and-httponly-cookie.md) | Same-origin API via Next.js rewrite and httpOnly JWT cookie | Accepted |
| [0004](0004-url-as-list-state-with-tanstack-query.md) | URL as list state with TanStack Query (no Redux) | Accepted |
| [0005](0005-staff-read-only-role-enforced-server-side.md) | Staff read-only role enforced server-side | Accepted |
| [0006](0006-delete-doctor-unassigns-patients.md) | Deleting a doctor unassigns patients (non-transactional ordering) | Accepted |
| [0007](0007-dashboard-in-memory-cache.md) | Dashboard in-memory cache with invalidate-on-write | Accepted |
| [0008](0008-skip-limit-pagination.md) | skip/limit pagination now, cursor pagination later | Accepted |
| [0009](0009-unversioned-api-prefix.md) | Unversioned `/api` prefix | Accepted |

See also [../architecture.md](../architecture.md), [../trade-offs.md](../trade-offs.md) and [../openapi.yaml](../openapi.yaml).
