import "./db-setup.ts";
// we need these to be imported first 👆

import { installGlobals } from "@remix-run/node";
import { cleanup, configure } from "@testing-library/react";
import { server } from "mocks/mock-server.ts";

configure({ asyncUtilTimeout: 500 });

installGlobals();

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "warn" });
});

afterEach(async () => {
  server.resetHandlers();
  vi.restoreAllMocks();
  cleanup();
});

afterAll(() => server.close());
