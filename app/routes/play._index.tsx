import { json, type LoaderFunctionArgs, redirect, type ActionFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server.ts';
import GameStatusDashboard from '~/components/GameStatusDashboard';
import { TotalAssetsJsonifier } from '~/game/services/jsonifier';
import { getOrInitializeTotalAssets, getOrInitializeTurn } from '~/game/services/game.server';
import { LaboratoryRepository } from '~/game/lifecycle/game.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: '/',
  });
  await getOrInitializeTurn(user.id);
  const totalAssets = await getOrInitializeTotalAssets(user.id);
  const laboratory = await LaboratoryRepository.get(user.id);
  return json({
    totalAssetsJson: TotalAssetsJsonifier.toJson(totalAssets),
    batteryCapacity: laboratory.batteryCapacity,
    performance: laboratory.performance,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/',
  });
  return redirect('/play/router');
}

export default function Page() {
  const { totalAssetsJson, batteryCapacity, performance } = useLoaderData<typeof loader>();
  const totalAssets = TotalAssetsJsonifier.fromJson(totalAssetsJson);
  return (
    <>
      <GameStatusDashboard
        totalAssets={totalAssets}
        batteryCapacity={batteryCapacity}
        performance={performance}
      />
      <Form method="post">
        <button type="submit">Start Game</button>
      </Form>
    </>
  );
}
