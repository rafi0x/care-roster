# ADR 0008: skip/limit pagination now, cursor pagination as the upgrade path

- Status: Accepted
- Scope: `listQuery` and `paginated` in `server/src/utils/query.ts`, list services

## Context

The UI shows numbered pages, a total count and "page N of M", and lets users jump to arbitrary pages.

## Decision

Lists take `page` (>= 1, default 1) and `limit` (1 to 100, default 10) and return `meta: {page, limit, total, totalPages}`. The service runs `find().skip((page-1)*limit).limit(limit)` and `countDocuments(filter)` in parallel. Ordering is `(createdAt, _id)` (ADR 0002), which keeps pages stable.

## Consequences

- Supports jump-to-page and exact totals.
- `skip` walks and discards index entries, so cost grows linearly with page depth; `countDocuments` is also O(matching documents). Fine for the intended data volume, noticeable at hundreds of thousands of matching rows.
- Rows inserted or deleted between two page requests can still shift items across a page boundary; stability covers timestamp ties, not concurrent writes.
- Upgrade path: keyset (cursor) pagination on `(createdAt, _id)`: the indexes already end in that pair, so the change is a `{createdAt, _id}` range condition plus an opaque cursor in the response. The UI would move to next/previous controls and drop exact totals (or compute them separately and cache them).

## Alternatives considered

- Cursor pagination now: constant cost per page, but no page numbers or jump-to-page, and `sort=patients` would need a computed sort key in the cursor.
- Load everything client-side: breaks at modest data sizes.
