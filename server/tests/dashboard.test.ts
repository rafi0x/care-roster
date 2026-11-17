import { describe, expect, it } from 'vitest';
import { Doctor } from '../src/modules/doctors/doctor.model';
import { Patient } from '../src/modules/patients/patient.model';
import { daysAgo, loginAs, makeDoctor, makePatient, patientInput } from './helpers';

describe('GET /api/dashboard/stats', () => {
  it('aggregates totals, per-doctor counts, breakdowns and a zero-filled timeline', async () => {
    const api = await loginAs();
    const a = await makeDoctor({ name: 'Dr. A', specialization: 'Cardiology', createdAt: daysAgo(60) });
    const b = await makeDoctor({ name: 'Dr. B', specialization: 'Neurology', createdAt: daysAgo(2) });
    await makeDoctor({ name: 'Dr. C', specialization: 'Cardiology', createdAt: daysAgo(2) });
    await makePatient(a._id, { condition: 'critical', createdAt: daysAgo(40) });
    await makePatient(a._id, { condition: 'stable', createdAt: daysAgo(3) });
    await makePatient(a._id, { condition: 'stable', createdAt: daysAgo(3) });
    await makePatient(b._id, { condition: 'critical', createdAt: daysAgo(0) });

    const { data } = (await api.get('/api/dashboard/stats?days=7').expect(200)).body;

    expect(data.totals).toEqual({ doctors: 3, patients: 4, newDoctors: 2, newPatients: 3, criticalPatients: 2 });
    expect(data.patientsPerDoctor).toEqual([
      { doctorId: a.id, name: 'Dr. A', specialization: 'Cardiology', count: 3 },
      { doctorId: b.id, name: 'Dr. B', specialization: 'Neurology', count: 1 },
    ]);
    expect(data.patientsByCondition).toEqual([
      { condition: 'critical', count: 2 },
      { condition: 'stable', count: 2 },
    ]);
    expect(data.doctorsBySpecialization).toEqual([
      { specialization: 'Cardiology', count: 2 },
      { specialization: 'Neurology', count: 1 },
    ]);

    const day = (d: number) => daysAgo(d).toISOString().slice(0, 10);
    expect(data.timeline).toHaveLength(7);
    expect(data.timeline.at(-1)).toEqual({ date: day(0), patients: 1, doctors: 0 });
    expect(data.timeline.find((t: any) => t.date === day(3))).toEqual({ date: day(3), patients: 2, doctors: 0 });
    expect(data.timeline.find((t: any) => t.date === day(2))).toEqual({ date: day(2), patients: 0, doctors: 2 });
    expect(data.timeline[0].date).toBe(day(6));
  });

  it('validates the range', async () => {
    const api = await loginAs();
    await api.get('/api/dashboard/stats?days=9999').expect(400);
  });
});

describe('dashboard cache', () => {
  it('serves cached stats but reflects a write immediately', async () => {
    const api = await loginAs();
    const doc = await makeDoctor();
    const first = await api.get('/api/dashboard/stats').expect(200);
    await Doctor.collection.insertOne({ name: 'Dr. Direct', createdAt: new Date() }); // bypasses the API: still cached
    const cached = await api.get('/api/dashboard/stats').expect(200);
    expect(cached.body.data.totals.doctors).toBe(first.body.data.totals.doctors);

    await api.post(`/api/doctors/${doc.id}/patients`).send(patientInput()).expect(201); // a write drops the cache
    const fresh = await api.get('/api/dashboard/stats').expect(200);
    expect(fresh.body.data.totals.doctors).toBe(first.body.data.totals.doctors + 1);
  });

  it('keeps unassigned patients out of the per-doctor ranking', async () => {
    const api = await loginAs();
    const doc = await makeDoctor();
    await makePatient(doc._id);
    await Patient.collection.insertOne({ name: 'No Doctor', doctor: null, condition: 'stable', createdAt: new Date() });
    const res = await api.get('/api/dashboard/stats').expect(200);
    expect(res.body.data.patientsPerDoctor).toHaveLength(1);
  });
});
