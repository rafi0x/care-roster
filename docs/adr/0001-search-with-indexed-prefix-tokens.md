# ADR 0001: Search with indexed prefix tokens

- Status: Accepted
- Scope: `server/src/utils/search.ts`, doctor and patient models

## Context

Doctor and patient lists have a search-as-you-type box matching several fields (doctor: name, specialization, hospital, email, phone; patient: name, phone, email). Users type partial words ("cardio"), so whole-word matching is not enough, and the lists must not scan the collection on every keystroke.

## Decision

Each document stores `searchTokens`, a lowercased, de-duplicated array of the words in its searchable fields, plus the digits-only form of a value when it has 6 or more digits (so phone numbers match without separators). A `pre('validate')` hook rebuilds it on every `save()`/`create()`, and a multikey index `{searchTokens: 1}` covers it. The field is `select: false` and removed from JSON output.

A query is split into at most 5 terms (letters/digits only). Every term must match, each as an anchored, case-sensitive, regex-escaped prefix: `{$and: [{searchTokens: {$regex: '^neuro'}}, ...]}`. An anchored prefix on an indexed field is answered by an index range scan. Punctuation-only input matches nothing (`$in: []`).

## Consequences

- Partial-word search stays index-backed. A server test checks `explain()` for no `COLLSCAN` on list queries.
- Documents are slightly larger, writes maintain one more index.
- Matching is by word prefix only: `ology` does not find `Cardiology`. Terms are ANDed, each against any token, so term order does not matter.
- Search is bound to the `save()` path. Any update that bypasses it (`updateMany`, `findOneAndUpdate`) leaves tokens stale. The services use `save()` for this reason.
- Existing documents need a backfill if the searchable field set changes.
- No ranking, no typo tolerance.

## Alternatives considered

- Case-insensitive `$regex` per field in an `$or`: right behaviour, cannot use an index, scans the collection per keystroke.
- `$text` index: fast, but matches whole words, so "cardio" finds nothing until "cardiology" is typed; no prefix support.
- Atlas Search / external engine: gives typo tolerance and ranking, adds infrastructure. Documented next step; only `utils/search.ts` and the hooks would change.
