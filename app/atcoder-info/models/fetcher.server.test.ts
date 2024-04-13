import { prisma } from "~/db.server.ts";
import { createFetchLog, fetchIfAllowed } from "./fetcher.server.ts";
import { PROBLEM_UPDATE_INTERVAL } from "./problem.server.ts";
import type { MockInstance } from "vitest";
import { server } from "mocks/mock-server.ts";
import { http } from "msw";

describe("fetchIfAllowed", () => {
  let mockedFetch: MockInstance;
  beforeEach(async () => {
    mockedFetch = vi.spyOn(global, "fetch");
    server.use(http.get("https://example.com", () => new Response("")));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it.each([
    PROBLEM_UPDATE_INTERVAL,
    PROBLEM_UPDATE_INTERVAL * 1.00001,
    PROBLEM_UPDATE_INTERVAL * 10,
  ])("should fetch when the specified interval elapsed", async (elapsed) => {
    const lastFetchedTime = new Date(Date.now() - elapsed);
    const endpoint = "https://example.com";
    await createFetchLog(endpoint, 200, lastFetchedTime);
    expect(mockedFetch).not.toHaveBeenCalled();
    const fetchLogs = await prisma.atCoderAPIFetchLog.findMany();
    expect(fetchLogs).toHaveLength(1);
    await fetchIfAllowed(endpoint, PROBLEM_UPDATE_INTERVAL);
    const fetchLogs2 = await prisma.atCoderAPIFetchLog.findMany();
    expect(fetchLogs2).toHaveLength(2);
    expect(mockedFetch).toHaveBeenCalled();
  });
  it.each([PROBLEM_UPDATE_INTERVAL * 0.9999999, PROBLEM_UPDATE_INTERVAL * 0.1])(
    "should not fetch when the specified interval doesnt elapsed",
    async (elapsed) => {
      const lastFetchedTime = new Date(Date.now() - elapsed);
      const endpoint = "https://example.com";
      await createFetchLog(endpoint, 200, lastFetchedTime);
      expect(mockedFetch).not.toHaveBeenCalled();
      const fetchLogs = await prisma.atCoderAPIFetchLog.findMany();
      expect(fetchLogs).toHaveLength(1);
      await fetchIfAllowed(endpoint, PROBLEM_UPDATE_INTERVAL);
      const fetchLogs2 = await prisma.atCoderAPIFetchLog.findMany();
      expect(fetchLogs2).toHaveLength(1);
      expect(mockedFetch).not.toHaveBeenCalled();
    },
  );
});
