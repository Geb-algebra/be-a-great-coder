import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
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
    laboratoryValue: laboratory.laboratoryValue,
  });
}

export default function Page() {
  const { totalAssetsJson, laboratoryValue } = useLoaderData<typeof loader>();
  const totalAssets = TotalAssetsJsonifier.fromJson(totalAssetsJson);
  return (
    <>
      <GameStatusDashboard totalAssets={totalAssets} laboratoryValue={laboratoryValue} />
      <Outlet />
    </>
  );
}
