import { createServer } from 'http';

import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import closeWithGrace from 'close-with-grace';
import { createRequestHandler } from '@remix-run/express';

import type { ServerBuild as _ServerBuild } from '@remix-run/server-runtime';
import { type ServerBuild, broadcastDevReady, installGlobals } from '@remix-run/node';

installGlobals();

const BUILD_PATH = '../build/index.js';
const build = (await import(BUILD_PATH)) as unknown as ServerBuild;

let devBuild = build as unknown as _ServerBuild;
let devToolsConfig = null;
// Make sure you guard this with NODE_ENV check
if (process.env.NODE_ENV === 'development') {
  const { withServerDevTools, defineServerConfig } = await import('remix-development-tools/server');
  // Allows you to define the configuration for the dev tools
  devToolsConfig = defineServerConfig({
    //... your config here ...
  });
  // wrap the build with the dev tools
  devBuild = withServerDevTools(build as unknown as _ServerBuild, devToolsConfig);
}

const app = express();

app.use(compression()); // compress static files

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// Remix fingerprints its assets so we can cache forever.
app.use('/build', express.static('public/build', { immutable: true, maxAge: '1y' }));

// Aggressively cache fonts for a year
app.use('/fonts', express.static('public/fonts', { immutable: true, maxAge: '1y' }));

app.use(morgan('tiny')); // logging

const httpServer = createServer(app);

app.all(
  '*',
  createRequestHandler({
    build: process.env.NODE_ENV === 'development' ? (devBuild as unknown as ServerBuild) : build,
    mode: process.env.NODE_ENV,
  }),
);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.info(`Running app in ${process.env.NODE_ENV} mode`);
  console.info(`Express server running at: http://localhost:${PORT}`);
  if (process.env.NODE_ENV === 'development') broadcastDevReady(build);
});

// If you want to run the remix dev command with --no-restart, see https://github.com/remix-run/remix/blob/templates_v2_dev/templates/express

closeWithGrace(async () => {
  await new Promise((resolve, reject) => {
    httpServer.close((e) => (e ? reject(e) : resolve('ok')));
  });
});
