import { setupServer } from "msw/node";
import { http, passthrough } from "msw";

import { detailedProblemsMock } from "./detailed-problems.ts";
import { atcoderUserPageMock } from "./atcoder-user-page.ts";
import { submissionsMock } from "./submissions.ts";

export const server = setupServer(
  http.post(`${process.env.REMIX_DEV_HTTP_ORIGIN}/ping`, (req) => passthrough()),
  detailedProblemsMock,
  atcoderUserPageMock,
  submissionsMock,
);
