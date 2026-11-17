import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './tests/global-setup.ts',
    setupFiles: './tests/setup.ts',
    hookTimeout: 120_000, // first run downloads the mongod binary
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
      MONGO_URI: 'mongodb://unused-in-tests',
    },
  },
});
