import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, Form, useRouteLoaderData } from '@remix-run/react';
import { authenticator } from '~/accounts/services/auth.server.ts';
import { GameStatusRepository, TurnRepository } from '~/game/lifecycle/game.server.ts';
import { GameStatusUpdateService, getNextTurn } from '~/game/services/game.server.ts';
import { getRequiredStringFromFormData } from '~/utils/utils.ts';
import type { loader as baseLoader } from './play._base.tsx';
import { GameStatusJsonifier } from '~/game/services/jsonifier.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const turn = await TurnRepository.getOrThrow(user.id);
  if (turn !== 'sell-products') {
    return redirect('/play/router');
  }
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  try {
    const formData = await request.formData();
    const productName = getRequiredStringFromFormData(formData, 'product');
    const quantityToMake = Number(getRequiredStringFromFormData(formData, 'quantity'));
    const gameStatus = await GameStatusRepository.getOrThrow(user.id);
    const { newStatus, quantity } = GameStatusUpdateService.manufactureProducts(
      gameStatus,
      productName,
      quantityToMake,
    );
    const finalStatus = GameStatusUpdateService.sellProducts(
      newStatus,
      new Map([[productName, quantity]]),
    );
    await GameStatusRepository.save(user.id, finalStatus);
    await TurnRepository.save(user.id, getNextTurn(await TurnRepository.getOrThrow(user.id)));
    return redirect('/play/router');
  } catch (error) {
    if (error instanceof Response && error.status >= 400) {
      return { error: (await error.json()) as { message: string } };
    }
    throw error;
  }
}

export const meta: MetaFunction = () => {
  return [{ title: '' }];
};

export default function Page() {
  const baseLoaderData = useRouteLoaderData<typeof baseLoader>('routes/play._base');
  const actionData = useActionData<typeof action>();
  if (!baseLoaderData) return null;
  const gameStatus = GameStatusJsonifier.fromJson(baseLoaderData.gameStatusJson);
  return (
    <div>
      <h1 className="font-bold text-2xl">Manufacture</h1>
      <p>{actionData?.error.message}</p>
      <Form method="post">
        <label htmlFor="product">Product</label>
        <select name="product">
          <option value="sword">Sword</option>
        </select>
        <label htmlFor="quantity">Quantity</label>
        <input type="number" name="quantity" min="0" max={gameStatus.robotEfficiencyLevel} />
        <button type="submit">Make Items</button>
      </Form>
    </div>
  );
}
