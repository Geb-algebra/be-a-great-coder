import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';

import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import AuthFormInput from '~/components/AuthFormInput.tsx';

import { authenticator, isUsernameAvailable } from '~/accounts/services/auth.server.ts';
import { getSession, sessionStorage } from '~/accounts/services/session.server.ts';
import AuthContainer from '~/components/AuthContainer.tsx';
import AuthButton from '~/components/AuthButton.tsx';
import AuthErrorMessage from '~/components/AuthErrorMessage.tsx';
import { getRequiredStringFromFormData } from '~/utils.ts';
import GoogleAuthButton from '~/components/GoogleAuthButton.tsx';
import PasskeyHero from '~/components/PasskeyHero.tsx';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: '/play',
  });
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const username = getRequiredStringFromFormData(formData, 'username');
    if (!(await isUsernameAvailable(username))) throw new Error('username already taken');
    const session = await getSession(request);
    session.set('username', username);
    return redirect('/signup/passkey', {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  } catch (error) {
    // Because redirects work by throwing a Response, you need to check if the
    // caught error is a response and return it or throw it again
    if (error instanceof Response) return error;
    console.error(error);
    if (error instanceof Error) {
      return json({ errorMessage: error.message }, { status: 400 });
    } else {
      return json({ errorMessage: 'unknown error' }, { status: 500 });
    }
  }
}

export const meta: MetaFunction = () => {
  return [{ title: 'Sign Up' }];
};

export default function LoginPage() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex flex-col gap-6">
      <AuthErrorMessage message={actionData?.errorMessage} />
      <AuthContainer>
        <Form method="post" className="flex flex-col gap-6 ">
          <div>
            <AuthFormInput
              name="username"
              label="Username"
              id="username"
              type="text"
              autofocus={true}
            />
          </div>
          <AuthButton type="submit">Signup with Passkey</AuthButton>
          <PasskeyHero className="mt-6" />
        </Form>
      </AuthContainer>
      <AuthContainer>
        <Form method="post" action="/google">
          <GoogleAuthButton>Signup with Google</GoogleAuthButton>
        </Form>
      </AuthContainer>
    </div>
  );
}
