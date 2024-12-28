import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { handleFormSubmit } from "remix-auth-webauthn/browser";
import { AccountRepository } from "~/accounts/lifecycle/account.server";
import AuthButton from "~/components/AuthButton.tsx";
import AuthContainer from "~/components/AuthContainer.tsx";
import AuthErrorMessage from "~/components/AuthErrorMessage.tsx";
import PasskeyHero from "~/components/PasskeyHero.tsx";
import { ObjectNotFoundError, ValueError } from "~/errors";
import { authenticator, verifyNewAuthenticator, webAuthnStrategy } from "~/services/auth.server.ts";
import { getSession } from "~/services/session.server.ts";
import { getRequiredStringFromFormData } from "~/utils/utils.ts";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/welcome" });
  return webAuthnStrategy.generateOptions(request, user);
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/" });
  const session = await getSession(request);
  const expectedChallenge = session.get("challenge");
  if (!expectedChallenge) {
    throw new ValueError("Expected challenge not found.");
  }
  try {
    const formData = await request.formData();
    let data: RegistrationResponseJSON;
    try {
      const responseData = getRequiredStringFromFormData(formData, "response");
      data = JSON.parse(responseData);
    } catch {
      throw new ValueError("Invalid passkey response JSON.");
    }
    const account = await AccountRepository.getById(user.id);
    if (!account) throw new ObjectNotFoundError("Account not found");
    const newAuthenticator = await verifyNewAuthenticator(data, expectedChallenge);
    account.authenticators.push({ ...newAuthenticator, name: null });
    await AccountRepository.save(account);
    throw redirect("/play/settings");
  } catch (error) {
    if (error instanceof Response && error.status >= 400) {
      return { error: (await error.json()) as { message: string } };
    }
    throw error;
  }
}

export const meta: MetaFunction = () => {
  return [{ title: "Add a new Passkey" }];
};

export default function Page() {
  const options = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="pt-24 w-full">
        <div className="flex flex-col gap-6">
          <AuthErrorMessage message={actionData?.error.message} />
          <AuthContainer>
            <Form method="post" onSubmit={handleFormSubmit(options)}>
              <input type="hidden" name="username" value={options.user?.username} />
              <AuthButton type="submit" value="registration">
                Create a New Passkey
              </AuthButton>
            </Form>
            <PasskeyHero />
          </AuthContainer>
        </div>
      </div>
    </div>
  );
}
