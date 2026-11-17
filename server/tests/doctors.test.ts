import { beforeEach, describe, expect, it } from 'vitest';
import { Doctor } from '../src/modules/doctors/doctor.model';
import { Patient } from '../src/modules/patients/patient.model';
import { searchFilter } from '../src/utils/search';
import { daysAgo, doctorInput, loginAs, makeDoctor, makePatient, patientInput } from './helpers';

type Agent = Awaited<ReturnType<typeof loginAs>>;
let api: Agent;
beforeEach(async () => {
  api = await loginAs();
});

describe('POST /api/doctors', () => {
  it('creates a doctor', async () => {
    const input = doctorInput({ name: '  Dr. Alice Rahman ', email: 'Alice@Example.com' });
    const res = await api.post('/api/doctors').send(input).expect(201);
    expect(res.body.data).toMatchObject({ name: 'Dr. Alice Rahman', email: 'alice@example.com', hospital: input.hospital });
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.searchTokens).toBeUndefined();
  });

  it('rejects invalid input with field-level details', async () => {
    const res = await api.post('/api/doctors').send({ name: '', email: 'bad', phone: 'x' }).expect(400);
    expect(Object.keys(res.body.error.details)).toEqual(
      expect.arrayContaining(['name', 'email', 'phone', 'specialization', 'hospital']),
    );
  });

  it('rejects a duplicate email with 409', async () => {
    await makeDoctor({ email: 'dup@example.com' });
    const res = await api.post('/api/doctors').send(doctorInput({ email: 'dup@example.com' })).expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});

describe('GET /api/doctors sorting', () => {
  it('sorts by date added in either direction', async () => {
    await makeDoctor({ name: 'Dr. Old', createdAt: daysAgo(10) });
    await makeDoctor({ name: 'Dr. New', createdAt: daysAgo(1) });
    const asc = await api.get('/api/doctors?order=asc').expect(200);
    expect(asc.body.data.map((d: { name: string }) => d.name)).toEqual(['Dr. Old', 'Dr. New']);
    const desc = await api.get('/api/doctors').expect(200);
    expect(desc.body.data[0].name).toBe('Dr. New');
  });

  it('sorts by number of patients across pages', async () => {
    const [a, b, c] = [await makeDoctor({ name: 'Dr. A' }), await makeDoctor({ name: 'Dr. B' }), await makeDoctor({ name: 'Dr. C' })];
    for (const [d, n] of [[a, 1], [b, 3], [c, 2]] as const) for (let i = 0; i < n; i++) await makePatient(d.id);
    const res = await api.get('/api/doctors?sort=patients&limit=2').expect(200);
    expect(res.body.data.map((d: { name: string; patientCount: number }) => [d.name, d.patientCount])).toEqual([['Dr. B', 3], ['Dr. C', 2]]);
    expect(res.body.meta.total).toBe(3);
    const asc = await api.get('/api/doctors?sort=patients&order=asc').expect(200);
    expect(asc.body.data[0].name).toBe('Dr. A');
  });
});

describe('GET /api/doctors', () => {
  it('paginates newest first', async () => {
    for (let i = 0; i < 25; i++) await makeDoctor({ name: `Dr. Number ${i}`, createdAt: daysAgo(25 - i) });

    const res = await api.get('/api/doctors?page=2&limit=10').expect(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.meta).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 });
    expect(res.body.data[0].name).toBe('Dr. Number 14');
  });

  it('rejects out-of-range pagination', async () => {
    await api.get('/api/doctors?limit=1000').expect(400);
    await api.get('/api/doctors?page=0').expect(400);
  });

  it('searches by case-insensitive word prefix across name, specialization, hospital and email', async () => {
    await makeDoctor({ name: 'Dr. Alice Rahman', specialization: 'Cardiology', hospital: 'Green Life' });
    await makeDoctor({ name: 'Dr. Bob Karim', specialization: 'Neurology', hospital: 'Square Hospital' });

    const names = async (q: string) =>
      (await api.get(`/api/doctors?search=${encodeURIComponent(q)}`).expect(200)).body.data.map((d: any) => d.name);

    expect(await names('ALI')).toEqual(['Dr. Alice Rahman']);
    expect(await names('neuro')).toEqual(['Dr. Bob Karim']);
    expect(await names('square')).toEqual(['Dr. Bob Karim']);
    expect(await names('bob neuro')).toEqual(['Dr. Bob Karim']); // every term must match
    expect(await names('alice neuro')).toEqual([]);
    expect(await names('.*')).toEqual([]); // regex input is escaped
  });

  it('filters by specialization, hospital and created date range', async () => {
    await makeDoctor({ name: 'Old', specialization: 'Cardiology', hospital: 'A', createdAt: daysAgo(40) });
    await makeDoctor({ name: 'Mid', specialization: 'Neurology', hospital: 'A', createdAt: daysAgo(10) });
    await makeDoctor({ name: 'New', specialization: 'Cardiology', hospital: 'B', createdAt: daysAgo(1) });

    const names = async (qs: string) =>
      (await api.get(`/api/doctors?${qs}`).expect(200)).body.data.map((d: any) => d.name);

    expect(await names('specialization=Cardiology')).toEqual(['New', 'Old']);
    expect(await names('hospital=A')).toEqual(['Mid', 'Old']);
    expect(await names('specialization=Cardiology&hospital=B')).toEqual(['New']);
    const day = (d: number) => daysAgo(d).toISOString().slice(0, 10);
    expect(await names(`from=${day(15)}&to=${day(5)}`)).toEqual(['Mid']);
    expect(await names(`to=${day(1)}`)).toEqual(['New', 'Mid', 'Old']); // "to" is inclusive of the whole day
  });

  it('includes a patient count per doctor', async () => {
    const busy = await makeDoctor({ name: 'Busy' });
    await makeDoctor({ name: 'Idle' });
    await makePatient(busy._id);
    await makePatient(busy._id);

    const res = await api.get('/api/doctors').expect(200);
    const counts = Object.fromEntries(res.body.data.map((d: any) => [d.name, d.patientCount]));
    expect(counts).toEqual({ Busy: 2, Idle: 0 });
  });

  it('lists distinct filter options', async () => {
    await makeDoctor({ specialization: 'Neurology', hospital: 'B' });
    await makeDoctor({ specialization: 'Cardiology', hospital: 'A' });
    await makeDoctor({ specialization: 'Cardiology', hospital: 'A' });
    const res = await api.get('/api/doctors/filters').expect(200);
    expect(res.body.data).toEqual({ specializations: ['Cardiology', 'Neurology'], hospitals: ['A', 'B'] });
  });
});

describe('/api/doctors/:id', () => {
  it('gets one doctor, 404s on unknown and 400s on malformed ids', async () => {
    const doc = await makeDoctor();
    const res = await api.get(`/api/doctors/${doc.id}`).expect(200);
    expect(res.body.data).toMatchObject({ id: doc.id, name: doc.name, patientCount: 0 });
    await api.get('/api/doctors/64b7f0f0f0f0f0f0f0f0f0f0').expect(404);
    await api.get('/api/doctors/not-an-id').expect(400);
  });

  it('updates a doctor and keeps search in sync', async () => {
    const doc = await makeDoctor({ name: 'Dr. Before' });
    const res = await api.patch(`/api/doctors/${doc.id}`).send({ name: 'Dr. After' }).expect(200);
    expect(res.body.data.name).toBe('Dr. After');
    expect((await api.get('/api/doctors?search=after')).body.meta.total).toBe(1);
    expect((await api.get('/api/doctors?search=before')).body.meta.total).toBe(0);
  });

  it('deletes a doctor and keeps their patients as unassigned', async () => {
    const doc = await makeDoctor();
    const other = await makeDoctor();
    const mine = await makePatient(doc._id);
    await makePatient(other._id);
    await api.delete(`/api/doctors/${doc.id}`).expect(204);
    await api.get(`/api/doctors/${doc.id}`).expect(404);
    expect(await Patient.countDocuments()).toBe(2);

    const unassigned = await api.get('/api/patients?doctor=unassigned').expect(200);
    expect(unassigned.body.data.map((p: { id: string; doctor: unknown }) => [p.id, p.doctor])).toEqual([[mine.id, null]]);
  });

  it('lets an unassigned patient be given a new doctor', async () => {
    const gone = await makeDoctor();
    const patient = await makePatient(gone._id);
    await api.delete(`/api/doctors/${gone.id}`).expect(204);
    const next = await makeDoctor();
    const res = await api.patch(`/api/patients/${patient.id}`).send({ doctor: next.id }).expect(200);
    expect(res.body.data.doctor).toMatchObject({ id: next.id });
  });
});

describe('/api/doctors/:id/patients', () => {
  it('adds a patient under a doctor and lists only that doctor’s patients', async () => {
    const doc = await makeDoctor();
    const other = await makeDoctor();
    await makePatient(other._id);

    const created = await api.post(`/api/doctors/${doc.id}/patients`).send(patientInput({ name: 'Rina' })).expect(201);
    expect(created.body.data).toMatchObject({ name: 'Rina', doctor: { id: doc.id, name: doc.name } });

    const list = await api.get(`/api/doctors/${doc.id}/patients`).expect(200);
    expect(list.body.data.map((p: any) => p.name)).toEqual(['Rina']);
    expect(list.body.meta.total).toBe(1);
  });

  it('validates the patient and the doctor', async () => {
    const doc = await makeDoctor();
    const res = await api.post(`/api/doctors/${doc.id}/patients`).send({ name: 'X', age: -1, condition: 'zombie' }).expect(400);
    expect(Object.keys(res.body.error.details)).toEqual(expect.arrayContaining(['age', 'condition', 'gender', 'phone']));
    await api.post('/api/doctors/64b7f0f0f0f0f0f0f0f0f0f0/patients').send(patientInput()).expect(404);
  });

  it('deletes a patient from the doctor’s list, scoped to that doctor', async () => {
    const doc = await makeDoctor();
    const other = await makeDoctor();
    const mine = await makePatient(doc._id);
    const theirs = await makePatient(other._id);

    await api.delete(`/api/doctors/${doc.id}/patients/${theirs.id}`).expect(404);
    await api.delete(`/api/doctors/${doc.id}/patients/${mine.id}`).expect(204);
    expect(await Patient.countDocuments()).toBe(1);
  });
});

describe('stable pagination', () => {
  it('never repeats or skips a doctor when createdAt timestamps collide', async () => {
    const at = daysAgo(1);
    for (let i = 0; i < 12; i++) await makeDoctor({ createdAt: at });
    const ids: string[] = [];
    for (const page of [1, 2, 3]) {
      const res = await api.get(`/api/doctors?limit=5&page=${page}`).expect(200);
      ids.push(...res.body.data.map((d: { id: string }) => d.id));
    }
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
  });
});

describe('query plans', () => {
  it('answers search and filtered lists from indexes, never a collection scan', async () => {
    for (let i = 0; i < 30; i++) await makeDoctor();

    const plan = async (filter: object) =>
      JSON.stringify(await Doctor.find(filter).sort({ createdAt: -1, _id: -1 }).limit(10).explain('queryPlanner'));

    for (const filter of [searchFilter('ali'), { specialization: 'Cardiology' }, { hospital: 'City Hospital' }, {}]) {
      const p = await plan(filter);
      expect(p).toContain('IXSCAN');
      expect(p).not.toContain('COLLSCAN');
    }
    // equality + sort is served by the compound index without an in-memory sort
    expect(await plan({ specialization: 'Cardiology' })).not.toContain('"SORT"');
  });
});
