import { type MetaFunction, json, type LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server.ts';
import {
  GameStatusFactory,
  GameStatusRepository,
  TurnFactory,
  TurnRepository,
} from '~/game/lifecycle/game.server.ts';
import { GameStatusJsonifier } from '~/game/services/jsonifier.ts';
import { ObjectNotFoundError } from '~/errors.ts';
import type { GameStatus, Turn } from '~/game/models/game.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: '/',
  });
  let gameStatus: GameStatus;
  let turn: Turn;

  try {
    gameStatus = await GameStatusRepository.getOrThrow(user.id);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      gameStatus = GameStatusFactory.initialize();
      await GameStatusRepository.save(user.id, gameStatus);
    } else {
      throw error;
    }
  }

  try {
    turn = await TurnRepository.getOrThrow(user.id);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      turn = TurnFactory.initialize();
      await TurnRepository.save(user.id, turn);
    } else {
      throw error;
    }
  }

  return json({ gameStatusJson: GameStatusJsonifier.toJson(gameStatus), turn });
}

export const meta: MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export default function Index() {
  const { gameStatusJson } = useLoaderData<typeof loader>();
  const gameStatus = GameStatusJsonifier.fromJson(gameStatusJson);

  return (
    <div className="pt-16">
      <p>
        money: {gameStatus.money} / iron: {gameStatus.ingredientStock.get('iron')} / robot
        efficiency: {gameStatus.robotEfficiencyLevel} / robot quality:{' '}
        {gameStatus.robotQualityLevel}
      </p>
      <Outlet />
    </div>
  );
}
