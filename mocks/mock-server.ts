import { setupServer } from 'msw/node';
import { http, passthrough } from 'msw';

export const server = setupServer(
  http.post(`${process.env.REMIX_DEV_HTTP_ORIGIN}/ping`, (req) => passthrough()),
);
