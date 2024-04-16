// app/routes/auth/google.tsx
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server.ts";

export const loader = () => redirect("/login");

export const action = ({ request }: ActionFunctionArgs) => {
  return authenticator.authenticate("google", request);
};
