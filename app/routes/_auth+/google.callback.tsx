// app/routes/auth/google/callback.tsx
import { type LoaderFunctionArgs } from '@remix-run/node';
import { authenticator } from '~/services/auth.server.ts';

export let loader = ({ request }: LoaderFunctionArgs) => {
  return authenticator.authenticate('google', request, {
    successRedirect: '/play',
    failureRedirect: '/login',
  });
};
