module.exports = {
  apps: [
    {
      name: 'carerooster-api',
      script: 'dist/server.js',
      // One process on purpose: the dashboard cache and the rate limits live in memory, so a second worker
      // would keep its own copy (a write handled by worker A would not clear worker B's cache).
      // Move both to Redis before raising `instances`.
      exec_mode: 'fork',
      instances: 1,
      // Restart instead of letting a leak thrash the box.
      max_memory_restart: '512M',
      // Matches the 10 s forced-exit timer in src/server.ts: finish in-flight requests, then close MongoDB.
      kill_timeout: 10000,
      env: { NODE_ENV: 'production' },
      env_production: { NODE_ENV: 'production' },
    },
  ],
};
