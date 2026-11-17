import { beforeEach, describe, expect, it } from 'vitest';
import { daysAgo, loginAs, makeDoctor, makePatient } from './helpers';

type Agent = Awaited<ReturnType<typeof loginAs>>;
let api: Agent;
beforeEach(async () => {
  api = await loginAs();
});

const names = async (qs = '') => (await api.get(`/api/patients?${qs}`).expect(200)).body.data.map((p: any) => p.name);

describe('GET /api/patients', () => {
  it('lists patients newest first with their doctor and pagination meta', async () => {
    const doc = await makeDoctor({ name: 'Dr. House' });
    for (let i = 0; i < 12; i++) await makePatient(doc._id, { name: `P${i}`, createdAt: daysAgo(12 - i) });

    const res = await api.get('/api/patients?page=2&limit=5').expect(200);
    expect(res.body.meta).toEqual({ page: 2, limit: 5, total: 12, totalPages: 3 });
    expect(res.body.data.map((p: any) => p.name)).toEqual(['P6', 'P5', 'P4', 'P3', 'P2']);
    expect(res.body.data[0].doctor).toMatchObject({ id: doc.id, name: 'Dr. House' });
  });

  it('searches by name, phone and email prefix', async () => {
    const doc = await makeDoctor();
    await makePatient(doc._id, { name: 'Karim Uddin', phone: '+8801911222333', email: 'karim@mail.com' });
    await makePatient(doc._id, { name: 'Salma Khatun', phone: '+8801555000111' });

    expect(await names('search=kar')).toEqual(['Karim Uddin']);
    expect(await names('search=KHATUN')).toEqual(['Salma Khatun']);
    expect(await names('search=8801555')).toEqual(['Salma Khatun']);
    expect(await names('search=zzz')).toEqual([]);
  });

  it('filters by condition, gender, doctor and date range', async () => {
    const a = await makeDoctor();
    const b = await makeDoctor();
    await makePatient(a._id, { name: 'P1', condition: 'critical', gender: 'male', createdAt: daysAgo(30) });
    await makePatient(a._id, { name: 'P2', condition: 'stable', gender: 'female', createdAt: daysAgo(8) });
    await makePatient(b._id, { name: 'P3', condition: 'critical', gender: 'female', createdAt: daysAgo(2) });

    const day = (d: number) => daysAgo(d).toISOString().slice(0, 10);
    expect(await names('condition=critical')).toEqual(['P3', 'P1']);
    expect(await names('gender=female')).toEqual(['P3', 'P2']);
    expect(await names(`doctor=${a.id}`)).toEqual(['P2', 'P1']);
    expect(await names(`condition=critical&doctor=${b.id}`)).toEqual(['P3']);
    expect(await names(`from=${day(10)}&to=${day(5)}`)).toEqual(['P2']);
    await api.get('/api/patients?condition=zombie').expect(400);
    await api.get('/api/patients?from=yesterday').expect(400);
  });
});

describe('/api/patients/:id', () => {
  it('edits patient information', async () => {
    const doc = await makeDoctor();
    const p = await makePatient(doc._id, { name: 'Old Name', condition: 'stable' });

    const res = await api.patch(`/api/patients/${p.id}`).send({ name: 'New Name', condition: 'recovering', age: 41 }).expect(200);
    expect(res.body.data).toMatchObject({ name: 'New Name', condition: 'recovering', age: 41 });
    expect(await names('search=new')).toEqual(['New Name']);
  });

  it('can reassign a patient, but only to an existing doctor', async () => {
    const a = await makeDoctor();
    const b = await makeDoctor();
    const p = await makePatient(a._id);

    const res = await api.patch(`/api/patients/${p.id}`).send({ doctor: b.id }).expect(200);
    expect(res.body.data.doctor.id).toBe(b.id);
    await api.patch(`/api/patients/${p.id}`).send({ doctor: '64b7f0f0f0f0f0f0f0f0f0f0' }).expect(404);
  });

  it('rejects invalid edits', async () => {
    const p = await makePatient((await makeDoctor())._id);
    await api.patch(`/api/patients/${p.id}`).send({ condition: 'zombie' }).expect(400);
    await api.patch(`/api/patients/${p.id}`).send({ age: 500 }).expect(400);
    await api.patch(`/api/patients/${p.id}`).send({}).expect(400);
    await api.patch('/api/patients/64b7f0f0f0f0f0f0f0f0f0f0').send({ age: 5 }).expect(404);
  });

  it('deletes a patient', async () => {
    const p = await makePatient((await makeDoctor())._id);
    await api.delete(`/api/patients/${p.id}`).expect(204);
    await api.delete(`/api/patients/${p.id}`).expect(404);
  });
});
