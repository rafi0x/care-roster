/**
 * The one place the client talks to the REST API.
 * Requests go to same-origin `/api/*`, which Next.js rewrites to the Express server (see next.config.ts),
 * so the httpOnly session cookie is first-party and no CORS preflights are needed.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'UNKNOWN',
    /** First message per invalid field, ready to show under inputs. */
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

interface Options {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T = unknown>(path: string, { method = 'GET', body, signal }: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (res.ok) return json as T;

  // Session expired mid-use: send the user to sign in and bring them back afterwards.
  if (res.status === 401 && !path.startsWith('/auth/') && typeof window !== 'undefined') {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- outside React, and a reload clears stale state
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }

  const details: Record<string, string[]> = json?.error?.details ?? {};
  const fieldErrors = Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v?.[0] ?? 'Invalid value']));
  throw new ApiError(res.status, json?.error?.message ?? 'Something went wrong', json?.error?.code, fieldErrors);
}
