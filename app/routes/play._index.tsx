import { json, type LoaderFunctionArgs, redirect, type ActionFunctionArgs } from '@remix-run/node';
import { Form } from '@remix-run/react';
import { authenticator } from '~/accounts/services/auth.server.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/',
  });
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/',
  });
  return redirect('/play/router');
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
