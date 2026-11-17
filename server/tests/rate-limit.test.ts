import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

describe('global rate limit', () => {
  it('returns the 429 error envelope past the limit but never limits /api/health', async () => {
    const app = createApp({ globalLimit: 2 });
    await request(app).get('/api/doctors').expect(401);
    await request(app).get('/api/doctors').expect(401);
    const res = await request(app).get('/api/doctors').expect(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect((await request(app).get('/api/health')).status).not.toBe(429);
  });
});
