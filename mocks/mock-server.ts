import { http, passthrough } from "msw";
import { setupServer } from "msw/node";

import { atcoderUserPageMock } from "./atcoder-user-page.ts";
import { detailedProblemsMock } from "./detailed-problems.ts";
import { submissionsMock } from "./submissions.ts";

export const server = setupServer(
  http.post(`${process.env.REMIX_DEV_HTTP_ORIGIN}/ping`, (req) => passthrough()),
  detailedProblemsMock,
  atcoderUserPageMock,
  submissionsMock,
);
