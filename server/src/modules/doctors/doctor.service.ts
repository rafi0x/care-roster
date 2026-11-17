import { Types } from 'mongoose';
import { z } from 'zod';
import { notFound } from '../../utils/http-error';
import { dateRangeFilter, listQuery, paginated } from '../../utils/query';
import { searchFilter } from '../../utils/search';
import { Patient } from '../patients/patient.model';
import { Doctor } from './doctor.model';

export const doctorBody = z.object({
  name: z.string().trim().min(2).max(100),
  specialization: z.string().trim().min(2).max(100),
  hospital: z.string().trim().min(2).max(150),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{6,20}$/, 'Enter a valid phone number'),
  email: z.email().trim().toLowerCase(),
});

export const doctorUpdateBody = doctorBody.partial().refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const doctorListQuery = listQuery.extend({
  specialization: z.string().trim().max(100).optional(),
  hospital: z.string().trim().max(150).optional(),
  sort: z.enum(['createdAt', 'patients']).default('createdAt'),
});

/** One grouped, index-covered query for the whole page instead of a $lookup (or a query) per doctor. */
async function patientCounts(ids: Types.ObjectId[]) {
  const rows = await Patient.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { doctor: { $in: ids } } },
    { $group: { _id: '$doctor', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

export async function listDoctors(q: z.infer<typeof doctorListQuery>) {
  const filter = {
    ...(q.specialization && { specialization: q.specialization }),
    ...(q.hospital && { hospital: q.hospital }),
    ...dateRangeFilter(q.from, q.to),
    ...searchFilter(q.search),
  };
  const dir = q.order === 'asc' ? 1 : -1;
  const skip = (q.page - 1) * q.limit;

  if (q.sort === 'patients') {
    // Sorting by a computed count needs the count first. One indexed $count lookup per matching doctor.
    // ponytail: counts every matching doctor before paging; precompute patientCount on Doctor if lists get huge.
    const [rows, total] = await Promise.all([
      Doctor.aggregate([
        { $match: filter },
        { $lookup: { from: 'patients', localField: '_id', foreignField: 'doctor', pipeline: [{ $count: 'n' }], as: 'pc' } },
        { $addFields: { patientCount: { $ifNull: [{ $first: '$pc.n' }, 0] } } },
        { $sort: { patientCount: dir, _id: 1 } },
        { $skip: skip },
        { $limit: q.limit },
        { $project: { pc: 0, searchTokens: 0 } },
      ]),
      Doctor.countDocuments(filter),
    ]);
    const data = rows.map(({ _id, __v, ...rest }) => ({ id: String(_id), ...rest }));
    return paginated(data, total, q.page, q.limit);
  }

  const [rows, total] = await Promise.all([
    Doctor.find(filter).sort({ createdAt: dir }).skip(skip).limit(q.limit).lean(),
    Doctor.countDocuments(filter),
  ]);
  const counts = await patientCounts(rows.map((r) => r._id));
  const data = rows.map(({ _id, __v, ...rest }) => ({ id: String(_id), ...rest, patientCount: counts.get(String(_id)) ?? 0 }));
  return paginated(data, total, q.page, q.limit);
}

export async function doctorFilters() {
  const [specializations, hospitals] = await Promise.all([Doctor.distinct('specialization'), Doctor.distinct('hospital')]);
  return { specializations: specializations.sort(), hospitals: hospitals.sort() };
}

export async function getDoctor(id: string) {
  const [doctor, patientCount] = await Promise.all([Doctor.findById(id), Patient.countDocuments({ doctor: id })]);
  if (!doctor) throw notFound('Doctor');
  return { ...doctor.toJSON(), patientCount };
}

export const createDoctor = (body: z.infer<typeof doctorBody>) => Doctor.create(body);

export async function updateDoctor(id: string, body: z.infer<typeof doctorUpdateBody>) {
  const doctor = await Doctor.findById(id);
  if (!doctor) throw notFound('Doctor');
  doctor.set(body);
  return doctor.save(); // save() so validators and the search-token hook run
}

export async function deleteDoctor(id: string) {
  const { deletedCount } = await Doctor.deleteOne({ _id: id });
  if (!deletedCount) throw notFound('Doctor');
  // ponytail: not transactional (needs a replica set). Wrap both in a session if orphaned patients ever matter.
  await Patient.deleteMany({ doctor: id });
}
