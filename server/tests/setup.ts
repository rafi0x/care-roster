import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, inject } from 'vitest';

// One database per test file so files can run in parallel workers.
beforeAll(async () => {
  await mongoose.connect(inject('mongoUri'), { dbName: `test_${process.pid}_${Date.now()}` });
  await Promise.all(Object.values(mongoose.models).map((m) => m.init())); // build indexes (unique etc.)
});

afterEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
