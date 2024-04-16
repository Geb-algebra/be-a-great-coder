import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { remixDevTools } from "remix-development-tools/vite";
import { flatRoutes } from "remix-flat-routes";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    remixDevTools(),
    remix({
      ignoredRouteFiles: ["**/*"],
      routes: async (defineRoutes) => {
        return flatRoutes("routes", defineRoutes, {
          ignoredRouteFiles: [
            "**/.*",
            "**/*.test.{ts,tsx,js,jsx}",
            "**/*.spec.{ts,tsx,js,jsx}",
            "**/test/**",
          ],
        });
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    target: "ES2022",
  },
});
