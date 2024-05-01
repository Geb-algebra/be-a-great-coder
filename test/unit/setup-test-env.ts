import { installGlobals } from "@remix-run/node";
import { cleanup, configure } from "@testing-library/react";
import { server } from "mocks/mock-server.ts";
import { resetDB } from "test/utils.ts";

configure({ asyncUtilTimeout: 500 });

installGlobals({ nativeFetch: true });

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "warn" });
  await resetDB();
});

afterEach(async () => {
  await resetDB();
  server.resetHandlers();
  vi.restoreAllMocks();
  cleanup();
});

afterAll(() => server.close());
