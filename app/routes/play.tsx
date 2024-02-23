import { type MetaFunction, json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import Overlay from '~/components/Overlay.tsx';
import { authenticator } from '~/accounts/services/auth.server.ts';
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
      gameStatus = GameStatusFactory.initialize(user.id);
      await GameStatusRepository.save(user.id, gameStatus);
    } else {
      throw error;
    }
  }

  try {
    turn = await TurnRepository.getOrThrow(user.id);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      turn = TurnFactory.initialize(user.id);
      await TurnRepository.save(user.id, turn);
    } else {
      throw error;
    }
  }

  return json({ user, gameStatusJson: GameStatusJsonifier.toJson(gameStatus), turn });
}

export const meta: MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export default function Index() {
  const { user, gameStatusJson } = useLoaderData<typeof loader>();
  const gameStatus = GameStatusJsonifier.fromJson(gameStatusJson);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="w-full h-screen">
        <Overlay isShown={isMenuOpen} setIsShown={setIsMenuOpen}>
          <div className="absolute right-6 top-20 w-64 bg-white border border-gray-300 rounded-lg overflow-hidden z-10">
            <Link
              to="/play/settings"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
            >
              Settings
            </Link>
            <Link to="/logout" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
              Log Out
            </Link>
          </div>
        </Overlay>
        <nav className="fixed w-full h-16 flex justify-between items-center bg-white border-b border-gray-300">
          <Link to="/play">
            <h1 className="text-2xl font-bold mx-6">Be A Great Coder</h1>
          </Link>
          <button className="px-6 h-full" onClick={() => setIsMenuOpen(true)}>
            <h2>{user.name}</h2>
          </button>
        </nav>
        <div className="pt-16">
          <p>
            money: {gameStatus.money} / iron: {gameStatus.ingredientStock.get('iron')} / robot
            efficiency: {gameStatus.robotEfficiency} / robot quality: {gameStatus.robotQuality}
          </p>
          <Outlet />
        </div>
      </div>
    </>
  );
}
