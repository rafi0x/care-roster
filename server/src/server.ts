import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';

async function main() {
  // Indexes are declared on the schemas; build them from migrations/deploy in production, not on every boot.
  mongoose.set('autoIndex', env.NODE_ENV !== 'production');
  await mongoose.connect(env.MONGO_URI);

  const server = createApp().listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));

  const shutdown = () => server.close(() => mongoose.disconnect().then(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
