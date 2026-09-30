import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/** Integration tests against a real Postgres (`DATABASE_URL`, migrated and seeded). */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./src/test/empty.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
