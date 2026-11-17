import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';

async function main() {
  // Indexes are declared on the schemas; build them from migrations/deploy in production, not on every boot.
  mongoose.set('autoIndex', env.NODE_ENV !== 'production');
  // Fail fast (instead of hanging for 30s) when the database is unreachable; bound the pool.
  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5_000, maxPoolSize: 20 });

  const server = createApp().listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));

  const shutdown = () => {
    // Stop taking requests, finish in-flight ones, then close the DB. Don't wait forever on keep-alive sockets.
    setTimeout(() => process.exit(1), 10_000).unref();
    server.close(() => mongoose.disconnect().then(() => process.exit(0)));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
