import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, inject } from 'vitest';
import { invalidateDashboard } from '../src/modules/dashboard/dashboard.routes';

// One database per test file so files can run in parallel workers.
beforeAll(async () => {
  await mongoose.connect(inject('mongoUri'), { dbName: `test_${process.pid}_${Date.now()}` });
  await Promise.all(Object.values(mongoose.models).map((m) => m.init())); // build indexes (unique etc.)
});

afterEach(async () => {
  invalidateDashboard(); // tests write through the models, which bypass the API's invalidation
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
