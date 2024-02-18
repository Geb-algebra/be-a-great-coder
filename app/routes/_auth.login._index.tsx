import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
  json,
} from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { handleFormSubmit } from '~/accounts/services/webauthn.ts';

import { authenticator } from '~/accounts/services/auth.server.ts';
import AuthContainer from '~/components/AuthContainer.tsx';
import AuthButton from '~/components/AuthButton.tsx';
import AuthErrorMessage from '~/components/AuthErrorMessage.tsx';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getSession, sessionStorage } from '~/accounts/services/session.server.ts';
import GoogleAuthButton from '~/components/GoogleAuthButton.tsx';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, { successRedirect: '/' });
  const options = await generateAuthenticationOptions({ userVerification: 'preferred' });
  const session = await getSession(request);
  session.set('challenge', options.challenge);
  return json(options, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
      'Cache-Control': 'no-store',
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    await authenticator.authenticate('webauthn', request, {
      successRedirect: '/',
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
  return [{ title: 'Log In' }];
};

export default function LoginPage() {
  const options = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex flex-col gap-6">
      <AuthErrorMessage message={actionData?.error.message} />
      <AuthContainer>
        <Form method="post" onSubmit={handleFormSubmit(options, 'authentication')}>
          <AuthButton type="submit" value="authentication">
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
