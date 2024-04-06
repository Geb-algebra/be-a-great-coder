import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import { remixDevTools } from 'remix-development-tools/vite';
import { installGlobals } from '@remix-run/node';
import tsconfigPaths from 'vite-tsconfig-paths';
import { flatRoutes } from 'remix-flat-routes';

installGlobals();

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    remixDevTools(),
    remix({
      ignoredRouteFiles: ['**/*'],
      routes: async (defineRoutes) => {
        return flatRoutes('routes', defineRoutes, {
          ignoredRouteFiles: [
            '**/.*',
            '**/*.test.{ts,tsx,js,jsx}',
            '**/*.spec.{ts,tsx,js,jsx}',
            '**/test-utils.ts',
          ],
        });
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    target: 'ES2022',
  },
});
