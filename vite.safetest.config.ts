/// <reference types="vitest" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    testTimeout: 30000,
    reporters: ["json", "default"],
    outputFile: "results.json",
    setupFiles: ["setup-safetest"],
    include: ["**/*.safetest.?(c|m)[jt]s?(x)"],
    inspect: !process.env.CI,
    poolOptions: {
      threads: {
        singleThread: true,
      },
      forks: {
        singleFork: true, // set this to avoid multiple tests trying to interact DB at the same time.
      },
    },
  },
});
