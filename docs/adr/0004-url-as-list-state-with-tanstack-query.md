# ADR 0004: URL as list state with TanStack Query (no Redux)

- Status: Accepted
- Scope: `client/src/hooks/use-list-params.ts`, `client/src/lib/queries.ts`, `client/src/app/providers.tsx`

## Context

Nearly all client state is server state (lists, one doctor, dashboard numbers). The remaining UI state is search text, filters, sort and page number, which users expect to survive reload, work with back/forward, and be shareable.

## Decision

- Server state lives in TanStack Query, keyed by resource and parameters (for example `['patients', 'list', doctorId ?? 'all', params]`). Default `staleTime` is 30 s; `keepPreviousData` keeps the current page visible while the next loads; filter options use a 5 minute `staleTime`; the current user (`['me']`) uses `Infinity`.
- List state lives in the URL, read and written through `useListParams`. Any change other than `page` resets to page 1; empty values and `page=1` are dropped from the URL; `sort` and `order` are not counted as filters. Updates use `router.replace`.
- Every successful mutation (`useWrite`) invalidates the `doctors`, `patients` and `dashboard` query keys; only mounted queries refetch.
- No global client store.

## Consequences

- Filtered views are linkable (dashboard condition tiles link into pre-filtered patient lists) and survive reload.
- Loading, error, caching, cancellation and invalidation come from the library instead of hand-written reducers.
- Invalidation is coarse: one write refetches all visible doctor, patient and dashboard queries. Simple and correct, slightly more traffic than targeted updates.
- The URL is the contract for list params, so the client and the API must keep parameter names aligned.
- Retries: never on 4xx, at most twice otherwise.

## Alternatives considered

- Redux / Redux Toolkit (with or without RTK Query): more boilerplate for the same cache semantics; a second source of truth for filters.
- Component state for filters: lost on reload, not shareable.
- Server Components fetching per navigation: loses the instant paint from cache on back/forward and the keep-previous-page behaviour.
