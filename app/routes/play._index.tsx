import { json, type LoaderFunctionArgs, redirect, type ActionFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server.ts';
import GameStatusDashboard from '~/components/GameStatusDashboard';
import { GameStatusJsonifier } from '~/game/services/jsonifier';
import { getOrInitializeGameStatus, getOrInitializeTurn } from '~/game/services/game.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: '/',
  });
  const gameStatus = await getOrInitializeGameStatus(user.id);
  await getOrInitializeTurn(user.id);
  return json(GameStatusJsonifier.toJson(gameStatus));
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/',
  });
  return redirect('/play/router');
}

export default function Page() {
  const gameStatusJson = useLoaderData<typeof loader>();
  const gameStatus = GameStatusJsonifier.fromJson(gameStatusJson);
  return (
    <>
      <GameStatusDashboard gameStatus={gameStatus} />
      <Form method="post">
        <button type="submit">Start Game</button>
      </Form>
    </>
  );
}
