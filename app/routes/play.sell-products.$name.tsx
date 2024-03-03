import type { ActionFunctionArgs } from '@remix-run/node';
import { GameLogicViolated, ValueError } from '~/errors';
import { GameStatusRepository } from '~/game/lifecycle/game.server';
import { GameStatusUpdateService } from '~/game/services/game.server';
import { authenticator } from '~/services/auth.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const itemName = params.name;
  if (!itemName) throw new ValueError('Item name is required');
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: '/',
  });
  try {
    const gameStatus = await GameStatusRepository.getOrThrow(user.id);
    const { newStatus, quantity } = GameStatusUpdateService.manufactureProducts(
      gameStatus,
      itemName,
      1,
    );
    const finalStatus = GameStatusUpdateService.sellProducts(
      newStatus,
      new Map([[itemName, quantity]]),
    );
    await GameStatusRepository.save(user.id, finalStatus);
    return null;
  } catch (error) {
    if (error instanceof GameLogicViolated) {
      return { error: { message: error.message } };
    }
    throw error;
  }
}
