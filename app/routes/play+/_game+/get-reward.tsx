import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, Form, useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { authenticator } from '~/services/auth.server.ts';
import { ObjectNotFoundError } from '~/errors.ts';
import {
  LaboratoryRepository,
  TotalAssetsRepository,
  TurnRepository,
} from '~/game/lifecycle/game.server.ts';
import { TotalAssetsUpdateService, getNextTurn } from '~/game/services/game.server.ts';
import { getRequiredStringFromFormData } from '~/utils/utils.ts';
import { TotalAssetsJsonifier, LaboratoryJsonifier } from '~/game/services/jsonifier';
import GameStatusDashboard from '~/components/GameStatusDashboard';
import { calcRobotGrowthRate } from '~/game/services/config';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const laboratory = await LaboratoryRepository.get(user.id);
  const totalAssets = await TotalAssetsRepository.getOrThrow(user.id);
  const turn = await TurnRepository.getOrThrow(user.id);
  if (turn !== 'get-reward') {
    return redirect('/play/router');
  }
  const unrewardedProposedProblem = laboratory.getRewardUnreceivedResearch();
  if (!unrewardedProposedProblem) {
    TurnRepository.save(user.id, getNextTurn(await TurnRepository.getOrThrow(user.id)));
    return redirect('/play/router');
  }
  return json({
    totalAssetsJson: TotalAssetsJsonifier.toJson(totalAssets),
    laboratoryJson: LaboratoryJsonifier.toJson(laboratory),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  try {
    const laboratory = await LaboratoryRepository.get(user.id);
    const currentResearch = laboratory.getRewardUnreceivedResearch();
    if (!currentResearch) {
      throw new ObjectNotFoundError('unrewarded proposedProblem not found');
    }
    if (currentResearch.solvedAt) {
      currentResearch.batteryCapacityIncrement = calcRobotGrowthRate(
        currentResearch.problem.difficulty,
      );
    }
    const formData = await request.formData();
    const answerShown = getRequiredStringFromFormData(formData, 'answer-shown') === 'true';
    if (answerShown) {
      currentResearch.performanceIncrement = calcRobotGrowthRate(
        currentResearch.problem.difficulty,
      );
    }
    currentResearch.rewardReceivedAt = new Date();
    await LaboratoryRepository.save(user.id, laboratory);
    const totalAssets = await TotalAssetsRepository.getOrThrow(user.id);
    const newAssets = TotalAssetsUpdateService.chargeBattery(
      totalAssets,
      laboratory.batteryCapacity,
    );
    await TotalAssetsRepository.save(user.id, newAssets);
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
  const { totalAssetsJson, laboratoryJson } = useLoaderData<typeof loader>();
  const totalAssets = TotalAssetsJsonifier.fromJson(totalAssetsJson);
  const laboratory = LaboratoryJsonifier.fromJson(laboratoryJson);
  const currentResearch = laboratory.getRewardUnreceivedResearch();
  if (!currentResearch) throw new ObjectNotFoundError('unfinished proposedProblem not found');
  const actionData = useActionData<typeof action>();
  const [answerShown, setAnswerShown] = useState(false);

  return (
    <>
      <GameStatusDashboard totalAssets={totalAssets} laboratoryValue={laboratory.laboratoryValue} />
      <div>
        <h1 className="font-bold text-2xl">Get Reward</h1>
        <p>{currentResearch.problem.title}</p>
        <p>{currentResearch.problem.difficulty}</p>
        <p>started at: {currentResearch.createdAt.toISOString()}</p>
        <p>Cleared?: {String(!!currentResearch.solvedAt)}</p>
        <p>{actionData?.error.message}</p>
        <button disabled={answerShown} onClick={() => setAnswerShown(true)}>
          Show Answer
        </button>
        <Form method="post">
          <input type="hidden" name="answer-shown" value={String(answerShown)} />
          <button type="submit">Get Reward</button>
        </Form>
      </div>
    </>
  );
}
