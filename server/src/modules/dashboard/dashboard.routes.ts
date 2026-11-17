import { Router } from 'express';
import { z } from 'zod';
import { Doctor } from '../doctors/doctor.model';
import { Patient } from '../patients/patient.model';

const statsQuery = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) });

const DAY = 86_400_000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Documents created per UTC day since `since` (range scan on the createdAt index). */
const perDay = (since: Date) => [
  { $match: { createdAt: { $gte: since } } },
  { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
];

export const dashboardRouter = Router();

dashboardRouter.get('/stats', async (req, res) => {
  const { days } = statsQuery.parse(req.query);
  const today = new Date(isoDay(new Date())); // UTC midnight
  const since = new Date(today.getTime() - (days - 1) * DAY);

  // All aggregation happens in MongoDB, in parallel; only small summaries cross the wire.
  const [doctors, patients, criticalPatients, perDoctor, byCondition, bySpecialization, patientDays, doctorDays] =
    await Promise.all([
      Doctor.estimatedDocumentCount(), // collection metadata, O(1)
      Patient.estimatedDocumentCount(),
      Patient.countDocuments({ condition: 'critical' }),
      Patient.aggregate([
        { $group: { _id: '$doctor', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 10 }, // join only the 10 rows we display, not every doctor
        { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } },
        { $unwind: '$doctor' },
        { $project: { _id: 0, doctorId: { $toString: '$_id' }, name: '$doctor.name', specialization: '$doctor.specialization', count: 1 } },
      ]),
      Patient.aggregate([
        { $group: { _id: '$condition', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $project: { _id: 0, condition: '$_id', count: 1 } },
      ]),
      Doctor.aggregate([
        { $group: { _id: '$specialization', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $project: { _id: 0, specialization: '$_id', count: 1 } },
      ]),
      Patient.aggregate<{ _id: string; count: number }>(perDay(since)),
      Doctor.aggregate<{ _id: string; count: number }>(perDay(since)),
    ]);

  // Zero-fill so the chart has a continuous x-axis.
  const p = new Map(patientDays.map((r) => [r._id, r.count]));
  const d = new Map(doctorDays.map((r) => [r._id, r.count]));
  const timeline = Array.from({ length: days }, (_, i) => {
    const date = isoDay(new Date(since.getTime() + i * DAY));
    return { date, patients: p.get(date) ?? 0, doctors: d.get(date) ?? 0 };
  });
  const sum = (key: 'patients' | 'doctors') => timeline.reduce((n, t) => n + t[key], 0);

  res.json({
    data: {
      totals: { doctors, patients, newDoctors: sum('doctors'), newPatients: sum('patients'), criticalPatients },
      patientsPerDoctor: perDoctor,
      patientsByCondition: byCondition,
      doctorsBySpecialization: bySpecialization,
      timeline,
    },
  });
});
