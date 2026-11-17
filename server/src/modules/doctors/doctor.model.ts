import { model, Schema } from 'mongoose';
import { toJSON } from '../../utils/query';
import { buildSearchTokens } from '../../utils/search';

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    hospital: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    searchTokens: { type: [String], select: false },
  },
  { timestamps: true },
);

doctorSchema.set('toJSON', toJSON);

// Every list is sorted newest-first, so each index ends in createdAt (equality -> sort -> range).
doctorSchema.index({ createdAt: -1 });
doctorSchema.index({ specialization: 1, createdAt: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1 });
doctorSchema.index({ searchTokens: 1 });

export const doctorSearchTokens = (d: { name?: string; specialization?: string; hospital?: string; email?: string; phone?: string }) =>
  buildSearchTokens(d.name, d.specialization, d.hospital, d.email, d.phone);

doctorSchema.pre('validate', function () {
  this.searchTokens = doctorSearchTokens(this);
});

export const Doctor = model('Doctor', doctorSchema);
