import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, Form } from '@remix-run/react';
import { authenticator } from '~/accounts/services/auth.server.ts';
import { GameLogicViolated } from '~/errors';
import { GameStatusRepository, TurnRepository } from '~/game/lifecycle/game.server.ts';
import { GameStatusUpdateService, getNextTurn } from '~/game/services/game.server.ts';
import { getRequiredStringFromFormData } from '~/utils/utils.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const turn = await TurnRepository.getOrThrow(user.id);
  if (turn !== 'buy-ingredients') {
    return redirect('/play/router');
  }
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  try {
    const formData = await request.formData();
    const quantity = Number(getRequiredStringFromFormData(formData, 'quantity'));
    const gameStatus = await GameStatusRepository.getOrThrow(user.id);
    const newStatus = GameStatusUpdateService.buyIngredients(gameStatus, 'iron', quantity);
    await GameStatusRepository.save(user.id, newStatus);
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
  const actionData = useActionData<typeof action>();
  return (
    <div>
      <h1 className="font-bold text-2xl">Buy Ingredients</h1>
      <p>{actionData?.error.message}</p>
      <Form method="post">
        <label htmlFor="quantity">Quantity</label>
        <input type="number" id="quantity" name="quantity" />
        <button type="submit">Buy</button>
      </Form>
    </div>
  );
}
