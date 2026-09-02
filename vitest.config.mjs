import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// These are integration tests that hit the real MySQL database configured
// via env vars (see .env.example / .env.local) — not a mocked layer. That's
// deliberate: the whole point of this suite is to prove the actual DB
// behavior, matching how the rest of this codebase is audited/verified.
export default defineConfig({
  resolve: { alias: { '@': here } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.mjs'],
    setupFiles: ['./tests/setup.mjs'],
    testTimeout: 15000
  }
});
