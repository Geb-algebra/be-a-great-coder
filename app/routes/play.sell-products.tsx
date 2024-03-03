import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, Form, useLoaderData, useFetcher } from '@remix-run/react';
import { authenticator } from '~/services/auth.server.ts';
import { GameStatusRepository, TurnRepository } from '~/game/lifecycle/game.server.ts';
import { getNextTurn } from '~/game/services/game.server.ts';
import { GameStatusJsonifier } from '~/game/services/jsonifier.ts';
import { GameLogicViolated } from '~/errors.ts';
import GameStatusDashboard from '~/components/GameStatusDashboard.tsx';
import type { action as makeItemsAction } from './play.sell-products.$name.tsx';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const turn = await TurnRepository.getOrThrow(user.id);
  if (turn !== 'sell-products') {
    return redirect('/play/router');
  }
  const gameStatus = await GameStatusRepository.getOrThrow(user.id);
  return json(GameStatusJsonifier.toJson(gameStatus));
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  try {
    await TurnRepository.save(user.id, getNextTurn(await TurnRepository.getOrThrow(user.id)));
    return redirect('/play/router');
  } catch (error) {
    if (error instanceof GameLogicViolated) {
      return { error: { message: error.message } };
    }
    throw error;
  }
}

export const meta: MetaFunction = () => {
  return [{ title: '' }];
};

export default function Page() {
  const gameStatusJson = useLoaderData<typeof loader>();
  const gameStatus = GameStatusJsonifier.fromJson(gameStatusJson);
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher<typeof makeItemsAction>();
  const itemNames = ['sword'];

  return (
    <>
      <GameStatusDashboard gameStatus={gameStatus} />
      <div>
        <h1 className="font-bold text-2xl">Make and sell products</h1>
        <p>{actionData?.error.message ?? fetcher.data?.error.message ?? ''}</p>
        <ul>
          {itemNames.map((itemName) => (
            <li key={itemName}>
              <fetcher.Form method="post" action={itemName}>
                <button type="submit">Make {itemName}</button>
              </fetcher.Form>
            </li>
          ))}
        </ul>
        <Form method="post">
          <button type="submit">Finish Making Products</button>
        </Form>
      </div>
    </>
  );
}
