import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";

import { data } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import AuthFormInput from "~/components/AuthFormInput.tsx";

import { createId } from "@paralleldrive/cuid2";
import { handleFormSubmit } from "remix-auth-webauthn/browser";
import AuthButton from "~/components/AuthButton.tsx";
import AuthContainer from "~/components/AuthContainer.tsx";
import AuthErrorMessage from "~/components/AuthErrorMessage.tsx";
import GoogleAuthButton from "~/components/GoogleAuthButton.tsx";
import PasskeyHero from "~/components/PasskeyHero.tsx";
import { authenticator, webAuthnStrategy } from "~/services/auth.server.ts";
import { getSession, sessionStorage } from "~/services/session.server.ts";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, { successRedirect: "/" });
  const session = await getSession(request);
  const options = await webAuthnStrategy.generateOptions(request, null);
  session.set("challenge", options.challenge);
  return data(options, {
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    await authenticator.authenticate("webauthn", request, {
      successRedirect: "/play",
    });
    return { message: "" };
  } catch (error) {
    // Because redirects work by throwing a Response, you need to check if the
    // caught error is a response and return it or throw it again
    if (error instanceof Response && error.status < 400) throw error;
    if (error instanceof Response) {
      return data((await error.json()) as { message: string }, {
        status: error.status,
      });
    }
    console.error(error);
    if (error instanceof Error) {
      return data({ message: error.message }, { status: 400 });
    }
    return data({ message: "unknown error" }, { status: 500 });
  }
}

export const meta: MetaFunction = () => {
  return [{ title: "Sign Up" }];
};

export default function SignupPage() {
  const options = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex flex-col gap-6">
      <AuthContainer>
        <Form method="post" action="/google">
          <GoogleAuthButton>Signup with Google</GoogleAuthButton>
        </Form>
      </AuthContainer>
      <AuthErrorMessage
        message={
          actionData?.message ??
          (options.usernameAvailable === false ? "Username already taken" : "")
        }
      />
      <AuthContainer>
        <h2 className="text-xl font-semibold">Signup with Passkey</h2>
        <Form
          className="flex flex-col gap-6"
          method="post"
          onSubmit={handleFormSubmit(options, {
            generateUserId: createId,
          })}
        >
          <div>
            <AuthFormInput
              name="username"
              label="Username"
              id="username"
              type="text"
              readonly={options.usernameAvailable ?? false}
              autofocus={true}
            />
          </div>
          <AuthButton formMethod="GET" disabled={options.usernameAvailable ?? undefined}>
            Check Username
          </AuthButton>
          {options.usernameAvailable ? (
            <AuthButton type="submit" name="intent" value="registration">
              Signup with Passkey
            </AuthButton>
          ) : null}
          <PasskeyHero className="mt-6" />
        </Form>
      </AuthContainer>
    </div>
  );
}
