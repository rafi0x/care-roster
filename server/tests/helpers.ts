import request from 'supertest';
import { createApp } from '../src/app';
import { User } from '../src/modules/auth/user.model';
import { Doctor } from '../src/modules/doctors/doctor.model';
import { Patient } from '../src/modules/patients/patient.model';

export const app = createApp();

export const ADMIN = { email: 'admin@example.com', password: 'Admin@12345' };

/** Creates a user and returns a supertest agent holding its session cookie. */
export async function loginAs(role: 'admin' | 'staff' = 'admin') {
  const email = role === 'admin' ? ADMIN.email : 'staff@example.com';
  await User.create({ name: role, email, password: ADMIN.password, role });
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password: ADMIN.password }).expect(200);
  return agent;
}

let n = 0;
export function doctorInput(overrides: Record<string, unknown> = {}) {
  n += 1;
  return {
    name: `Dr. Test ${n}`,
    specialization: 'Cardiology',
    hospital: 'City Hospital',
    phone: `+88017000000${String(n).padStart(2, '0')}`,
    email: `doctor${n}@example.com`,
    ...overrides,
  };
}

export function patientInput(overrides: Record<string, unknown> = {}) {
  n += 1;
  return {
    name: `Patient ${n}`,
    age: 30,
    gender: 'female',
    phone: `+88018000000${String(n).padStart(2, '0')}`,
    condition: 'stable',
    ...overrides,
  };
}

export const makeDoctor = (overrides: Record<string, unknown> = {}) => new Doctor(doctorInput(overrides)).save();

export const makePatient = (doctor: unknown, overrides: Record<string, unknown> = {}) =>
  new Patient(patientInput({ doctor, ...overrides })).save();

export const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
