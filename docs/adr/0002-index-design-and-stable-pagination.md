# ADR 0002: Index design and `_id` tiebreaker for stable pagination

- Status: Accepted
- Scope: indexes in `doctor.model.ts` and `patient.model.ts`, sort in `doctor.service.ts` and `patient.service.ts`

## Context

Every list is ordered by `createdAt` (newest first by default, `order=asc|desc`) and filtered by equality fields (specialization, hospital, condition, doctor) and a `createdAt` range. Bulk inserts (the seed script, imports) produce identical `createdAt` values. With `skip/limit`, ordering by a non-unique key lets rows move between pages or appear twice.

## Decision

- Sort by `{createdAt: dir, _id: dir}`. `_id` is unique, so the order is total and pages are stable.
- Build each index as equality fields, then `createdAt`, then `_id`: `{specialization: 1, createdAt: -1, _id: -1}`, `{hospital: 1, ...}`, `{condition: 1, ...}`, `{doctor: 1, ...}`, plus the unfiltered `{createdAt: -1, _id: -1}`. A filtered page is read in order from the index with no in-memory SORT. The same index is walked backwards for `order=asc`.
- Patient counts for a page of doctors come from one grouped query on the `{doctor: 1, ...}` index, not a lookup per row.
- `sort=patients` is the exception: it computes a count per matching doctor with `$lookup` + `$count`, sorts by `{patientCount: dir, _id: 1}` and then pages.

## Consequences

- Filtered, paged lists are index-served; a server test asserts no `COLLSCAN`.
- Index count is fixed by the combinations in the code. Filtering by two equality fields at once (for example specialization and hospital) uses one index and filters the rest.
- `gender` has no index; it is a residual filter.
- `sort=patients` does work proportional to the number of matching doctors, not the page size (see trade-offs).
- Production sets `autoIndex: false`; indexes must be built in a deploy step.

## Alternatives considered

- Sort by `createdAt` alone: simpler indexes, but unstable pages under timestamp ties.
- One compound index per filter combination: more write cost, little gain at this size.
- Denormalised `patientCount` on doctors for sorting: fast sort, but needs counter maintenance on every patient write; deferred.
