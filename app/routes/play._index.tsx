import { type MetaFunction, json, type LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/accounts/services/auth.server.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/welcome',
  });
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/welcome',
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
