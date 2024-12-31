import { type ActionFunctionArgs, type LoaderFunctionArgs, data, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import Button from "~/components/Button";
import { authenticator } from "~/services/auth.server.ts";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  });
  return data({});
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  });
  return redirect("/play/router");
}

export default function Page() {
  return (
    <Form method="post">
      <Button type="submit">Start Game</Button>
    </Form>
  );
}
