import { installGlobals } from "@remix-run/node";
import { resetDB } from "test/utils.ts";
import { server } from "mocks/mock-server.ts";
import { cleanup, configure } from "@testing-library/react";

configure({ asyncUtilTimeout: 500 });

installGlobals();

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "warn" });
  await resetDB();
});

afterEach(async () => {
  await resetDB();
  server.resetHandlers();
  cleanup();
});

afterAll(() => server.close());
