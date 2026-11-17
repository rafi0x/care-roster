import { model, Schema } from 'mongoose';
import { toJSON } from '../../utils/query';
import { buildSearchTokens } from '../../utils/search';

export const CONDITIONS = ['stable', 'recovering', 'under_observation', 'critical', 'discharged'] as const;
export const GENDERS = ['male', 'female', 'other'] as const;

const patientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 130 },
    gender: { type: String, required: true, enum: GENDERS },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    condition: { type: String, required: true, enum: CONDITIONS },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', default: null }, // null = unassigned (e.g. their doctor was deleted)
    searchTokens: { type: [String], select: false },
  },
  { timestamps: true },
);

patientSchema.set('toJSON', toJSON);

// Lists sort by (createdAt, _id) so pages stay stable when timestamps collide.
patientSchema.index({ createdAt: -1, _id: -1 });
patientSchema.index({ doctor: 1, createdAt: -1, _id: -1 }); // a doctor's patient list + per-doctor counts
patientSchema.index({ condition: 1, createdAt: -1, _id: -1 });
patientSchema.index({ searchTokens: 1 });

export const patientSearchTokens = (p: { name?: string; phone?: string; email?: string | null }) =>
  buildSearchTokens(p.name, p.phone, p.email);

patientSchema.pre('validate', function () {
  this.searchTokens = patientSearchTokens(this);
});

export const Patient = model('Patient', patientSchema);
