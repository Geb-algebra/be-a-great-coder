import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useActionData, Form } from '@remix-run/react';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';
import AuthButton from '~/components/AuthButton.tsx';
import AuthContainer from '~/components/AuthContainer.tsx';
import AuthErrorMessage from '~/components/AuthErrorMessage.tsx';
import PasskeyHero from '~/components/PasskeyHero.tsx';
import { AccountRepository } from '~/accounts/models/account.server.ts';
import {
  WEBAUTHN_RP_ID,
  WEBAUTHN_RP_NAME,
  authenticator,
  verifyNewAuthenticator,
} from '~/accounts/services/auth.server.ts';
import { handleFormSubmit } from '~/accounts/services/webauthn.ts';
import { getRequiredStringFromFormData } from '~/utils.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/' });
  const account = await AccountRepository.getById(user.id);
  // When we pass a GET request to the authenticator, it will
  // throw a response that includes the WebAuthn options and
  // stores the challenge on session storage. To avoid needing
  // a CatchBoundary, we catch the response here and return it as
  // loader data.
  const options = await generateRegistrationOptions({
    rpName: WEBAUTHN_RP_NAME,
    rpID: WEBAUTHN_RP_ID,
    userID: user.id,
    userName: user.name,
    timeout: 60000,
    attestationType: 'none',
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });
  account.expectedChallenge = options.challenge;
  await AccountRepository.save(account);
  return json(options);
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/' });
  const account = await AccountRepository.getById(user.id);
  const expectedChallenge = account.expectedChallenge;
  if (!expectedChallenge) {
    throw new Error('Expected challenge not found.');
  }
  try {
    const formData = await request.formData();
    let data: RegistrationResponseJSON;
    try {
      const responseData = getRequiredStringFromFormData(formData, 'response');
      data = JSON.parse(responseData);
    } catch {
      throw new Error('Invalid passkey response JSON.');
    }
    const newAuthenticator = await verifyNewAuthenticator(data, expectedChallenge);
    account.authenticators.push({ ...newAuthenticator, name: null });
    account.expectedChallenge = null;
    await AccountRepository.save(account);
    throw redirect('/settings');
  } catch (error) {
    if (error instanceof Response && error.status >= 400) {
      return { error: (await error.json()) as { message: string } };
    }
    throw error;
  }
}

export const meta: MetaFunction = () => {
  return [{ title: 'Add a new Passkey' }];
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
