import { prisma } from '~/db.server.ts';
import { createFetchLog, fetchIfAllowed } from './fetchLog.server.ts';
import { PROBLEM_UPDATE_INTERVAL } from './problem.server.ts';
import type { SpyInstance } from 'vitest';

describe('fetchIfAllowed', () => {
  let mockedFetch: SpyInstance;
  beforeEach(async () => {
    mockedFetch = vi.spyOn(global, 'fetch');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it.each([
    PROBLEM_UPDATE_INTERVAL,
    PROBLEM_UPDATE_INTERVAL * 1.00001,
    PROBLEM_UPDATE_INTERVAL * 10,
  ])('should fetch when the specified interval elapsed', async (elapsed) => {
    const lastFetchedTime = new Date(Date.now() - elapsed);
    const endpoint = 'https://example.com';
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
    'should not fetch when the specified interval doesnt elapsed',
    async (elapsed) => {
      const lastFetchedTime = new Date(Date.now() - elapsed);
      const endpoint = 'https://example.com';
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
