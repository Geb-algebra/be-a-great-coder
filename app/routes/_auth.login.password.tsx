import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import AuthButton from '~/components/AuthButton.tsx';
import AuthContainer from '~/components/AuthContainer.tsx';
import AuthErrorMessage from '~/components/AuthErrorMessage.tsx';
import AuthFormInput from '~/components/AuthFormInput.tsx';

import { authenticator } from '~/services/auth.server.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: '/',
  });
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    await authenticator.authenticate('user-pass', request, {
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
  return [{ title: 'Login' }];
};

export default function LoginPage() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="flex flex-col gap-6">
      <AuthErrorMessage message={actionData?.error.message} />
      <AuthContainer>
        <Form method="post" className="flex flex-col gap-6">
          <AuthFormInput
            name="username"
            label="Username"
            id="username"
            type="text"
            autofocus={true}
          />
          <AuthFormInput name="password" label="Password" id="password" type="password" />
          <input type="hidden" name="type" value="authentication" />
          <AuthButton type="submit">Log In</AuthButton>
        </Form>
      </AuthContainer>
    </div>
  );
}
