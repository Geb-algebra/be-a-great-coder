import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import invariant from "tiny-invariant";
import { authenticator } from "~/services/auth.server.ts";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  });
  return null;
}

export async function action({ request, response }: ActionFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  });
  invariant(response);
  response.status = 302;
  response.headers.set("Location", "/play/router");
  throw response;
}

export default function Page() {
  return (
    <>
      <Form method="post">
        <button type="submit">Start Game</button>
      </Form>
    </>
  );
}
