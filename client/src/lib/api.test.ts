import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

const respond = (status: number, body?: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

afterEach(() => vi.restoreAllMocks());

describe('api', () => {
  it('sends JSON with the session cookie and returns the parsed body', async () => {
    const fetchMock = respond(200, { data: { id: '1' } });
    await expect(api('/doctors', { method: 'POST', body: { name: 'A' } })).resolves.toEqual({ data: { id: '1' } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/doctors');
    expect(init).toMatchObject({ method: 'POST', credentials: 'include', body: '{"name":"A"}' });
  });

  it('returns undefined for 204', async () => {
    respond(204);
    await expect(api('/patients/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('throws an ApiError carrying the server message and field details', async () => {
    respond(400, { error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: { email: ['Invalid email'] } } });
    const err = await api('/doctors', { method: 'POST', body: {} }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 400, message: 'Invalid request', fieldErrors: { email: 'Invalid email' } });
  });

  it('falls back to a readable message when the server is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api('/doctors')).rejects.toMatchObject({ status: 0, message: expect.stringMatching(/reach the server/i) });
  });
});
