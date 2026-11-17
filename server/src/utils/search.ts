/**
 * Index-backed "search as you type".
 *
 * Each document stores the lowercased words of its searchable fields in a
 * multikey-indexed `searchTokens` array. A query term then becomes an anchored,
 * case-sensitive prefix regex (/^term/), which MongoDB answers with an index
 * range scan instead of the collection scan an unanchored /term/i would need.
 */
export function buildSearchTokens(...values: Array<string | null | undefined>): string[] {
  const tokens = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const word of value.toLowerCase().split(/[^\p{L}\p{N}]+/u)) if (word) tokens.add(word);
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 6) tokens.add(digits); // phone numbers typed without separators
  }
  return [...tokens];
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Every term must prefix-match some token. Returns {} when there is nothing to search for. */
export function searchFilter(search?: string) {
  if (!search?.trim()) return {};
  const terms = search.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0, 5);
  // Punctuation-only input: there is something to search for, but nothing can match it.
  if (!terms.length) return { searchTokens: { $in: [] as string[] } };
  return { $and: terms.map((t) => ({ searchTokens: { $regex: `^${escapeRegex(t)}` } })) };
}
