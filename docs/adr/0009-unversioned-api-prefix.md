# ADR 0009: Unversioned `/api` prefix

- Status: Accepted
- Scope: route mounting in `server/src/app.ts`, rewrite in `client/next.config.ts`

## Context

The API has exactly one consumer, the Next.js client in the same repository, deployed together with it. There are no third-party integrations.

## Decision

Routes live under `/api` with no version segment (`/api/doctors`, not `/api/v1/doctors`). The contract is documented in `docs/openapi.yaml`. Breaking changes are made in the same change set as the client update.

## Consequences

- Shorter paths, no duplicated routers, one rewrite rule.
- Client and API must be deployed in lock-step; during a rolling deploy an old client may hit a new API. Additive changes (new optional fields or parameters) are safe; removals and renames are not.
- If an external consumer appears, add `/api/v2` alongside the current routes (mount a second router) or introduce a version header; the current prefix becomes the implicit v1.
- Error and success envelopes (`{data, meta?}`, `{error:{code,message,details?}}`) are the compatibility surface to protect.

## Alternatives considered

- `/api/v1` from day one: cheap, but pays a cost for a need that does not exist yet and implies a compatibility promise nobody has asked for.
- Header or media-type versioning: invisible in logs and the rewrite, harder to test by hand.
