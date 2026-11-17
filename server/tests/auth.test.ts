import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ADMIN, app, doctorInput, loginAs } from './helpers';

describe('auth', () => {
  it('logs in with valid credentials and sets an httpOnly cookie', async () => {
    await loginAs();
    const res = await request(app).post('/api/auth/login').send(ADMIN).expect(200);

    expect(res.body.data).toMatchObject({ email: ADMIN.email, role: 'admin' });
    expect(res.body.data.password).toBeUndefined();
    const cookie = ([] as string[]).concat(res.headers['set-cookie']).join(';');
    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('rejects a wrong password and an unknown email with the same 401', async () => {
    await loginAs();
    const wrong = await request(app).post('/api/auth/login').send({ ...ADMIN, password: 'nope-nope-nope' }).expect(401);
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: ADMIN.password })
      .expect(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('validates the login body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveProperty('email');
  });

  it('returns the current user on /me and 401 when anonymous', async () => {
    await request(app).get('/api/auth/me').expect(401);
    const agent = await loginAs();
    const res = await agent.get('/api/auth/me').expect(200);
    expect(res.body.data.email).toBe(ADMIN.email);
  });

  it('rejects a tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=abc.def.ghi').expect(401);
    // The dead cookie is cleared, so the client's "has a cookie" check cannot bounce between / and /login.
    expect(([] as string[]).concat(res.headers['set-cookie']).join(';')).toMatch(/token=;/);
  });

  it('logout clears the session', async () => {
    const agent = await loginAs();
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  it.each(['/api/doctors', '/api/patients', '/api/dashboard/stats'])('protects %s', async (path) => {
    await request(app).get(path).expect(401);
  });

  it('lets staff read but forbids them from changing records', async () => {
    const staff = await loginAs('staff');
    await staff.get('/api/doctors').expect(200);
    await staff.post('/api/doctors').send(doctorInput()).expect(403);
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/health', () => {
  it('reports ready while the database answers', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});
