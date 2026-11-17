import type { NextConfig } from 'next';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  output: 'standalone', // minimal self-contained server for the Docker image
  cacheComponents: true,
  partialPrefetching: true,
  // The browser only ever talks to this origin; /api/* is forwarded to the standalone Express server.
  // That keeps the session cookie first-party (SameSite=Lax works) and removes CORS preflights.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
