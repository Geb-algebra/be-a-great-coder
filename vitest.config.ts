/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    include: ['./app/**/*.test.{ts,tsx}', './test/integration/**/*.test.{ts,tsx}'],
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/unit/setup-test-env.ts'],
    poolOptions: {
      threads: {
        singleThread: true, // set this to avoid multiple tests trying to interact DB at the same time.
      },
    },
  },
});
