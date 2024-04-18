import { server } from "mocks/mock-server.ts";
import { http } from "msw";
import type { MockInstance } from "vitest";
import { prisma } from "~/db.server.ts";
import { fetchFromAtcoderAPI } from "./fetcher.server.ts";

describe("fetchFromAtcoderAPI", () => {
  it("fetches from the specified endpoint", async () => {
    const endpoint = "https://example.com";
    const hash = "hash";
    const mockServer = server.use(
      http.get(endpoint, () => new Response("hello", { headers: { ETAG: hash } })),
    );
    const res = await fetchFromAtcoderAPI(endpoint);
    expect(res).toBeDefined();
    expect(await res?.text()).toBe("hello");
  });

  it.each([200, 304])("records etag", async (status) => {
    const endpoint = "https://example.com";
    const hash = "hash";
    const mockServer = server.use(
      http.get(endpoint, () => new Response("hello", { headers: { ETAG: hash }, status })),
    );
    await fetchFromAtcoderAPI(endpoint);
    const etag = await prisma.atCoderAPIETag.findUnique({ where: { endpoint } });
    expect(etag?.hash).toBe(hash);
  });
});
