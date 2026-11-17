/** Brings the database's indexes in line with the schemas: `npm run db:indexes`. Drops indexes the schemas no longer declare. */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../modules/auth/user.model';
import { Doctor } from '../modules/doctors/doctor.model';
import { Patient } from '../modules/patients/patient.model';

async function main() {
  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5_000 });
  console.log(`Database: ${mongoose.connection.name}`);
  for (const m of [User, Doctor, Patient]) {
    const dropped = await m.syncIndexes();
    const all = (await m.collection.indexes()).map((i) => i.name);
    console.log(`${m.collection.name}: dropped [${dropped.join(', ')}]; now [${all.join(', ')}]`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
