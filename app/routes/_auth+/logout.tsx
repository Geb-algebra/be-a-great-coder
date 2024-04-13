import type { LoaderFunctionArgs } from "@remix-run/node";

import { authenticator } from "~/services/auth.server.ts";

export async function loader({ request }: LoaderFunctionArgs) {
  return authenticator.logout(request, { redirectTo: "/" });
}
