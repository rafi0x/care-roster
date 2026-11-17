/** Prints the query plan of the app's main list queries as a markdown table: `npm run db:explain`. */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { Doctor } from '../modules/doctors/doctor.model';
import { Patient } from '../modules/patients/patient.model';
import { searchFilter } from '../utils/search';

const stages = (n: any): string[] => (n ? [n.stage + (n.indexName ? `(${n.indexName})` : ''), ...stages(n.inputStage), ...(n.inputStages ?? []).flatMap(stages)] : []);

async function main() {
  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5_000 });
  console.log(`Database: ${mongoose.connection.name}\n`);

  const [doc] = await Doctor.aggregate([{ $sample: { size: 1 } }]);
  const sort = { createdAt: -1, _id: -1 } as const;
  const doctors = (filter: object) => Doctor.find(filter).sort(sort).limit(10);
  const patients = (filter: object) => Patient.find(filter).sort(sort).limit(10);

  const cases: Array<[string, { explain(v: string): Promise<any> }]> = [
    ['doctors: list', doctors({})],
    ['doctors: specialization', doctors({ specialization: 'Cardiology' })],
    ['doctors: hospital', doctors({ hospital: 'Square Hospital' })],
    ['doctors: search "dr ay"', doctors(searchFilter('dr ay'))],
    ['doctors: by patients (aggregate)', Doctor.aggregate([{ $lookup: { from: 'patients', localField: '_id', foreignField: 'doctor', pipeline: [{ $count: 'n' }], as: 'pc' } }, { $sort: { _id: 1 } }, { $limit: 10 }])],
    ['patients: list', patients({})],
    ['patients: by doctor', patients({ doctor: doc?._id })],
    ['patients: condition', patients({ condition: 'critical' })],
    ['patients: search "ay"', patients(searchFilter('ay'))],
  ];

  console.log('| query | plan | keys examined | docs examined | returned | ms |\n|---|---|---:|---:|---:|---:|');
  for (const [label, q] of cases) {
    const ex = await q.explain('executionStats');
    // Aggregates with $lookup report on the first stage's cursor; fall back to the top-level stats.
    const s = ex.executionStats ?? ex.stages?.[0]?.$cursor?.executionStats;
    const plan = ex.queryPlanner?.winningPlan ?? ex.stages?.[0]?.$cursor?.queryPlanner?.winningPlan;
    const summary = [...new Set(stages(plan?.queryPlan ?? plan))].join(' > ');
    console.log(`| ${label} | ${summary} | ${s?.totalKeysExamined} | ${s?.totalDocsExamined} | ${s?.nReturned} | ${s?.executionTimeMillis} |`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
