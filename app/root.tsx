import type { LinksFunction } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { ClientOnly } from "remix-utils/client-only";
import { Bootstrap } from "safetest/react";
import stylesheet from "~/styles/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/icon?family=Material+Icons" },
];

function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ClientOnly
          fallback={
            <>
              <Outlet />
              <ScrollRestoration />
              <Scripts />
            </>
          }
        >
          {() => (
            <Bootstrap
              importGlob={
                process.env.NODE_ENV !== "production"
                  ? import.meta.glob("./**/*.safetest.{j,t}s{,x}")
                  : false
              }
            >
              <Outlet />
              <ScrollRestoration />
              <Scripts />
            </Bootstrap>
          )}
        </ClientOnly>
      </body>
    </html>
  );
}

export default App;
