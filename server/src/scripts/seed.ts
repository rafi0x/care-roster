/** Resets the database with an admin user and realistic demo data: `npm run seed`. */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../modules/auth/user.model';
import { Doctor, doctorSearchTokens } from '../modules/doctors/doctor.model';
import { CONDITIONS, GENDERS, Patient, patientSearchTokens } from '../modules/patients/patient.model';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@doctortracker.dev';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';

const STAFF_EMAIL = 'staff@doctortracker.dev';
const STAFF_PASSWORD = 'Staff@12345';

const FIRST = ['Ayesha', 'Tanvir', 'Nusrat', 'Imran', 'Farhana', 'Rakib', 'Sadia', 'Mahmud', 'Tahmina', 'Shakil', 'Rumana', 'Arif', 'Lamia', 'Fahim', 'Sharmin', 'Nayeem', 'Mitu', 'Jubayer', 'Priya', 'Zahid'];
const LAST = ['Rahman', 'Hossain', 'Akter', 'Chowdhury', 'Islam', 'Karim', 'Ahmed', 'Sultana', 'Khan', 'Das', 'Sarker', 'Begum', 'Uddin', 'Haque', 'Roy'];
const SPECIALIZATIONS = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'Oncology', 'General Medicine', 'Gynecology'];
const HOSPITALS = ['Square Hospital', 'Evercare Hospital', 'United Hospital', 'Labaid Hospital', 'Popular Medical Centre', 'Ibn Sina Hospital'];

const pick = <T>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
const int = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (max: number) => new Date(Date.now() - Math.random() * max * 86_400_000);
const phone = (i: number) => `+8801${int(3, 9)}${String(10_000_000 + i).slice(-8)}`;

async function main() {
  if (env.NODE_ENV === 'production') throw new Error('Refusing to wipe a production database');
  await mongoose.connect(env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Doctor.deleteMany({}), Patient.deleteMany({})]);

  await User.create([
    { name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' },
    // Read-only demo account; keep in sync with client/src/features/auth/demo-accounts.ts
    { name: 'Staff', email: STAFF_EMAIL, password: STAFF_PASSWORD, role: 'staff' },
  ]);

  // insertMany skips document middleware, so the search tokens are set explicitly.
  const doctors = await Doctor.insertMany(
    Array.from({ length: 48 }, (_, i) => {
      const name = `Dr. ${pick(FIRST)} ${pick(LAST)}`;
      const doc = {
        name,
        specialization: pick(SPECIALIZATIONS),
        hospital: pick(HOSPITALS),
        phone: phone(i),
        email: `${name.slice(4).toLowerCase().replace(/\s+/g, '.')}${i}@hospital.dev`,
        createdAt: daysAgo(180),
      };
      return { ...doc, searchTokens: doctorSearchTokens(doc) };
    }),
  );

  await Patient.insertMany(
    Array.from({ length: 1200 }, (_, i) => {
      const name = `${pick(FIRST)} ${pick(LAST)}`;
      // Skewed so "patients per doctor" is interesting to look at.
      const doctor = doctors[Math.floor(Math.random() ** 2 * doctors.length)];
      const doc = {
        name,
        age: int(1, 90),
        gender: pick(GENDERS.slice(0, 2)),
        phone: phone(1000 + i),
        email: i % 3 ? `${name.toLowerCase().replace(/\s+/g, '.')}${i}@mail.dev` : undefined,
        condition: pick([...CONDITIONS, 'stable', 'stable', 'recovering'] as const),
        doctor: doctor._id,
        createdAt: daysAgo(90),
      };
      return { ...doc, searchTokens: patientSearchTokens(doc) };
    }),
  );

  await Promise.all([User.init(), Doctor.init(), Patient.init()]); // finish index builds before disconnecting
  console.log(`Seeded ${doctors.length} doctors, 1200 patients.\nLogin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (admin), ${STAFF_EMAIL} / ${STAFF_PASSWORD} (staff)`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
