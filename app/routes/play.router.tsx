import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useActionData, useSearchParams } from '@remix-run/react';
import { TurnRepository } from '~/game/lifecycle/game.server.ts';
import { authenticator } from '~/accounts/services/auth.server.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const turn = await TurnRepository.getOrThrow(user.id);
  return redirect(`/play/${turn}`);
}
