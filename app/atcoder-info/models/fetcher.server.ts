import type { AtCoderAPIETag } from "@prisma/client";

import { prisma } from "~/db.server.ts";

/**
 * fetch from the specified endpoint if the specified interval has passed since the last fetch
 * @param endpoint: string - a full path to the endpoint
 * @param interval: number - he required fetching interval in milliseconds
 * @returns Response | undefined: the response from the endpoint, or undefined if the interval has not passed
 */
export const fetchFromAtcoderAPI = async (endpoint: string): Promise<Response | undefined> => {
  const etag = await prisma.atCoderAPIETag.findUnique({ where: { endpoint } });
  const res = await fetch(endpoint, {
    headers: [
      ["ACCEPT-ENCODING", "gzip"],
      ["IF-NONE-MATCH", etag?.hash ?? ""],
    ],
  });
  const status = res.status;
  const hash = res.headers.get("ETAG");
  console.log(`fetched from ${endpoint}, status: ${status}, hash: ${hash}`);
  if (hash !== null) {
    await prisma.atCoderAPIETag.upsert({
      where: { endpoint },
      update: { hash },
      create: { endpoint, hash },
    });
  }
  return res;
};
