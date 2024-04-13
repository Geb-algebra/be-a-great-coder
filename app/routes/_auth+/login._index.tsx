import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { handleFormSubmit } from "remix-auth-webauthn/browser";

import { authenticator, webAuthnStrategy } from "~/services/auth.server.ts";
import AuthContainer from "~/components/AuthContainer.tsx";
import AuthButton from "~/components/AuthButton.tsx";
import AuthErrorMessage from "~/components/AuthErrorMessage.tsx";
import { sessionStorage } from "~/services/session.server.ts";
import GoogleAuthButton from "~/components/GoogleAuthButton.tsx";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, { successRedirect: "/" });
  return webAuthnStrategy.generateOptions(request, sessionStorage, null);
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    await authenticator.authenticate("webauthn", request, {
      successRedirect: "/play",
    });
  } catch (error) {
    if (error instanceof Response && error.status >= 400) {
      return { error: (await error.json()) as { message: string } };
    }
    throw error;
  }
  return null;
}

export const meta: MetaFunction = () => {
  return [{ title: "Log In" }];
};

export default function LoginPage() {
  const options = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex flex-col gap-6">
      <AuthErrorMessage message={actionData?.error.message} />
      <AuthContainer>
        <Form method="post" onSubmit={handleFormSubmit(options)}>
          <AuthButton type="submit" name="intent" value="authentication">
            Log In with Passkey
          </AuthButton>
        </Form>
        <Form method="post" action="/google">
          <GoogleAuthButton value="google">Log In with Google</GoogleAuthButton>
        </Form>
      </AuthContainer>
    </div>
  );
}
