import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, Form, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server.ts';
import { queryRandomProblemByDifficulty } from '~/atcoder-info/models/problem.server.ts';
import { getProblemSolvedTime } from '~/atcoder-info/services/atcoder.server.ts';
import { ObjectNotFoundError } from '~/errors.ts';
import {
  LaboratoryRepository,
  ResearchFactory,
  TotalAssetsRepository,
  TurnRepository,
} from '~/game/lifecycle/game.server.ts';
import { getNextTurn } from '~/game/services/game.server.ts';
import { LaboratoryJsonifier, TotalAssetsJsonifier } from '~/game/services/jsonifier';
import GameStatusDashboard from '~/components/GameStatusDashboard';
import { type Research } from '~/game/models/game';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const turn = await TurnRepository.getOrThrow(user.id);
  if (turn !== 'solve-problems') {
    return redirect('/play/router');
  }
  const laboratory = await LaboratoryRepository.get(user.id);
  const totalAssets = await TotalAssetsRepository.getOrThrow(user.id);
  const currentResearch = laboratory.getUnfinishedResearch();

  let research: Research;
  if (currentResearch) {
    const problemSolvedTime = await getProblemSolvedTime(
      currentResearch.problem.id,
      user.name,
      Math.floor(currentResearch.createdAt.getTime() / 1000),
    );
    if (problemSolvedTime) {
      currentResearch.solvedAt = problemSolvedTime;
      await LaboratoryRepository.save(user.id, laboratory);
    }
    research = currentResearch;
  } else {
    const problem = await queryRandomProblemByDifficulty(100);
    research = await ResearchFactory.create(user.id, problem);
    laboratory.researches.push(research);
    await LaboratoryRepository.save(user.id, laboratory);
  }
  return json({
    laboratoryJson: LaboratoryJsonifier.toJson(laboratory),
    totalAssetsJson: TotalAssetsJsonifier.toJson(totalAssets),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  try {
    const laboratory = await LaboratoryRepository.get(user.id);
    const currentResearch = laboratory.getUnfinishedResearch();
    if (!currentResearch) {
      throw new ObjectNotFoundError('unfinished proposedProblem not found');
    }
    currentResearch.finishedAt = new Date();
    await LaboratoryRepository.save(user.id, laboratory);
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
  const { laboratoryJson, totalAssetsJson } = useLoaderData<typeof loader>();
  const laboratory = LaboratoryJsonifier.fromJson(laboratoryJson);
  const totalAssets = TotalAssetsJsonifier.fromJson(totalAssetsJson);
  const currentResearch = laboratory.getUnfinishedResearch();
  if (!currentResearch) {
    throw new ObjectNotFoundError('unfinished research not found');
  }
  const actionData = useActionData<typeof action>();
  return (
    <>
      <GameStatusDashboard
        totalAssets={totalAssets}
        batteryCapacity={laboratory.batteryCapacity}
        performance={laboratory.performance}
      />
      <div>
        <h1 className="font-bold text-2xl">Solve Problems</h1>
        <div className="flex">
          <p>{currentResearch.problem.title}</p>
          <a
            href={`https://atcoder.jp/contests/${currentResearch.problem.id.split('_')[0]}/tasks/${currentResearch.problem.id}`}
          >
            Go to Problem Page!
          </a>
        </div>
        <p>{currentResearch.problem.difficulty}</p>
        <p>started at: {currentResearch.createdAt.toISOString()}</p>
        <p>Cleared at: {currentResearch.solvedAt?.toISOString() ?? null}</p>
        <p>{actionData?.error.message}</p>
        <Form method="post">
          <button type="submit">Finish</button>
        </Form>
      </div>
    </>
  );
}
