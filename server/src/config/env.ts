import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN_HOURS: z.coerce.number().positive().default(8),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  // Proxy hops in front of the API (nginx = 1, Vercel rewrite -> nginx = 2): decides which X-Forwarded-For entry is the client IP.
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
});

// .env.example holds $PLACEHOLDERS (CI fills them with envsubst); catch a copy that was never filled in.
const parsed = schema
  .refine((e) => !e.MONGO_URI.startsWith('$') && !e.JWT_SECRET.startsWith('$'), {
    path: ['MONGO_URI'],
    message: '.env still contains $PLACEHOLDER values from .env.example: replace them with real ones',
  })
  .safeParse(process.env);
if (!parsed.success) {
  // Fail fast: a server with a missing secret must never boot.
  console.error('Invalid environment (copied .env.example? replace each $PLACEHOLDER with a real value):', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
