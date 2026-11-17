import bcrypt from 'bcryptjs';
import { model, Schema, type InferSchemaType } from 'mongoose';
import { toJSON } from '../../utils/query';

export const ROLES = ['admin', 'staff'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // bcrypt hash, never selected by default
    role: { type: String, enum: ROLES, default: 'staff' },
  },
  { timestamps: true },
);

userSchema.set('toJSON', toJSON);

userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
