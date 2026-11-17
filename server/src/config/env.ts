import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN_HOURS: z.coerce.number().positive().default(8),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast: a server with a missing secret must never boot.
  console.error('Invalid environment:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
