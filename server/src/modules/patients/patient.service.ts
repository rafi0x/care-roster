import { z } from 'zod';
import { notFound } from '../../utils/http-error';
import { dateRangeFilter, listQuery, objectId, paginated } from '../../utils/query';
import { searchFilter } from '../../utils/search';
import { Doctor } from '../doctors/doctor.model';
import { CONDITIONS, GENDERS, Patient } from './patient.model';

const phone = z.string().trim().regex(/^\+?[\d\s()-]{6,20}$/, 'Enter a valid phone number');

export const patientBody = z.object({
  name: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(0).max(130),
  gender: z.enum(GENDERS),
  phone,
  email: z.email().trim().toLowerCase().optional().or(z.literal('').transform(() => undefined)),
  condition: z.enum(CONDITIONS),
});

export const patientUpdateBody = patientBody
  .extend({ doctor: objectId.nullable() }) // null = unassign
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const patientListQuery = listQuery.extend({
  condition: z.enum(CONDITIONS).optional(),
  gender: z.enum(GENDERS).optional(),
  doctor: z.union([objectId, z.literal('unassigned')]).optional(),
});

const DOCTOR_FIELDS = 'name specialization';

export async function listPatients(q: z.infer<typeof patientListQuery>) {
  const filter = {
    ...(q.doctor && { doctor: q.doctor === 'unassigned' ? null : q.doctor }),
    ...(q.condition && { condition: q.condition }),
    ...(q.gender && { gender: q.gender }),
    ...dateRangeFilter(q.from, q.to),
    ...searchFilter(q.search),
  };
  const dir = q.order === 'asc' ? 1 : -1;
  // Page and count run in parallel; lean() skips document hydration for read-only lists.
  const [rows, total] = await Promise.all([
    Patient.find(filter)
      .sort({ createdAt: dir, _id: dir })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('doctor', DOCTOR_FIELDS)
      .lean({ virtuals: false }),
    Patient.countDocuments(filter),
  ]);
  return paginated(rows.map(serialize), total, q.page, q.limit);
}

export async function createPatient(doctorId: string, body: z.infer<typeof patientBody>) {
  if (!(await Doctor.exists({ _id: doctorId }))) throw notFound('Doctor');
  const patient = await Patient.create({ ...body, doctor: doctorId });
  return patient.populate('doctor', DOCTOR_FIELDS);
}

export async function updatePatient(id: string, body: z.infer<typeof patientUpdateBody>) {
  const patient = await Patient.findById(id);
  if (!patient) throw notFound('Patient');
  if (body.doctor && !(await Doctor.exists({ _id: body.doctor }))) throw notFound('Doctor');
  patient.set(body);
  await patient.save(); // save() (not findByIdAndUpdate) so validators and the search-token hook run
  return patient.populate('doctor', DOCTOR_FIELDS);
}

export async function deletePatient(id: string) {
  const { deletedCount } = await Patient.deleteOne({ _id: id });
  if (!deletedCount) throw notFound('Patient');
}

/** Removes a patient from one doctor's list: the record is kept, just unassigned. */
export async function unassignPatient(id: string, doctorId: string) {
  const { matchedCount } = await Patient.updateOne({ _id: id, doctor: doctorId }, { $set: { doctor: null } });
  if (!matchedCount) throw notFound('Patient');
}

// Lean rows bypass the schema's toJSON, so shape them the same way here.
function serialize({ _id, __v, searchTokens, doctor, ...rest }: any) {
  const d = doctor && doctor._id ? { id: String(doctor._id), name: doctor.name, specialization: doctor.specialization } : doctor;
  return { id: String(_id), ...rest, doctor: d };
}
