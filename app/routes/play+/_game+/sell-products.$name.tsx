import type { ActionFunctionArgs } from '@remix-run/node';
import { GameLogicViolated, ValueError } from '~/errors';
import { TotalAssetsRepository } from '~/game/lifecycle/game.server';
import { TotalAssetsUpdateService } from '~/game/services/game.server';
import { authenticator } from '~/services/auth.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: '/',
  });
  try {
    const itemName = params.name;
    if (!itemName) throw new ValueError('Item name is required');
    const totalAssets = await TotalAssetsRepository.getOrThrow(user.id);
    const { newTotalAssets, quantity } = TotalAssetsUpdateService.manufactureProducts(
      totalAssets,
      itemName,
      1,
    );
    const finalTotalAssets = TotalAssetsUpdateService.sellProducts(
      newTotalAssets,
      new Map([[itemName, quantity]]),
    );
    await TotalAssetsRepository.save(user.id, finalTotalAssets);
    return null;
  } catch (error) {
    if (error instanceof GameLogicViolated) {
      return { error: { message: error.message } };
    }
    throw error;
  }
}
