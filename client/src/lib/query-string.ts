export type QueryParams = Record<string, string | number | null | undefined>;

/** Builds `?a=1&b=2`, skipping empty values. Returns '' when nothing is set. */
export function toQueryString(params: QueryParams): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}
