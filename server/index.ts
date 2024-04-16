import { createServer } from "node:http";

import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import closeWithGrace from "close-with-grace";
import compression from "compression";
import express from "express";
import morgan from "morgan";

installGlobals();

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      );

// Make sure you guard this with NODE_ENV check
if (process.env.NODE_ENV === "development") {
  if (process.env.MOCKS === "true") {
    await import("../mocks/index.ts");
  }
}

const app = express();

app.use(compression()); // compress static files

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", {
      immutable: true,
      maxAge: "1y",
    }),
  );
}
app.use(express.static("build/client", { maxAge: "1h" }));

app.use(morgan("tiny")); // logging

const httpServer = createServer(app);

app.all(
  "*",
  createRequestHandler({
    // @ts-ignore
    build: viteDevServer
      ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
      : await import("../build/server/index.js"),
    mode: process.env.NODE_ENV,
  }),
);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.info(`Running app in ${process.env.NODE_ENV} mode`);
  console.info(`Express server running at: http://localhost:${PORT}`);
});

// If you want to run the remix dev command with --no-restart, see https://github.com/remix-run/remix/blob/templates_v2_dev/templates/express

closeWithGrace(async () => {
  await new Promise((resolve, reject) => {
    httpServer.close((e) => (e ? reject(e) : resolve("ok")));
  });
});
