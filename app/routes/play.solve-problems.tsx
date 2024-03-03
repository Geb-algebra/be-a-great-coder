import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, Form, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server.ts';
import { queryRandomProblemByDifficulty } from '~/atcoder-info/models/problem.server.ts';
import { getProblemSolvedTime } from '~/atcoder-info/services/atcoder.server.ts';
import { ObjectNotFoundError } from '~/errors.ts';
import {
  GameStatusRepository,
  ProposedProblemFactory,
  ProposedProblemRepository,
  TurnRepository,
} from '~/game/lifecycle/game.server.ts';
import { getNextTurn } from '~/game/services/game.server.ts';
import { GameStatusJsonifier } from '~/game/services/jsonifier';
import GameStatusDashboard from '~/components/GameStatusDashboard';
import type { ProposedProblem } from '~/game/models/game';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const turn = await TurnRepository.getOrThrow(user.id);
  if (turn !== 'solve-problems') {
    return redirect('/play/router');
  }
  const gameStatus = await GameStatusRepository.getOrThrow(user.id);
  const currentProposedProblem = await ProposedProblemRepository.getUnfinished(user.id);

  let proposedProblem: ProposedProblem;
  if (currentProposedProblem) {
    const problemSolvedTime = await getProblemSolvedTime(
      currentProposedProblem.problem.id,
      user.name,
      Math.floor(currentProposedProblem.createdAt.getTime() / 1000),
    );
    if (problemSolvedTime) {
      currentProposedProblem.solvedAt = problemSolvedTime;
      await ProposedProblemRepository.save(currentProposedProblem);
    }
    proposedProblem = currentProposedProblem;
  } else {
    const problem = await queryRandomProblemByDifficulty(100);
    proposedProblem = await ProposedProblemFactory.create(user.id, problem);
    await ProposedProblemRepository.save(proposedProblem);
  }
  return json({ proposedProblem, gameStatusJson: GameStatusJsonifier.toJson(gameStatus) });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  try {
    const proposedProblem = await ProposedProblemRepository.getUnfinished(user.id);
    if (!proposedProblem) {
      throw new ObjectNotFoundError('unfinished proposedProblem not found');
    }
    proposedProblem.finishedAt = new Date();
    await ProposedProblemRepository.save(proposedProblem);
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
  const { proposedProblem, gameStatusJson } = useLoaderData<typeof loader>();
  const gameStatus = GameStatusJsonifier.fromJson(gameStatusJson);
  const actionData = useActionData<typeof action>();
  return (
    <>
      <GameStatusDashboard gameStatus={gameStatus} />
      <div>
        <h1 className="font-bold text-2xl">Solve Problems</h1>
        <div className="flex">
          <p>{proposedProblem.problem.title}</p>
          <a
            href={`https://atcoder.jp/contests/${proposedProblem.problem.id.split('_')[0]}/tasks/${proposedProblem.problem.id}`}
          >
            Go to Problem Page!
          </a>
        </div>
        <p>{proposedProblem.problem.difficulty}</p>
        <p>started at: {proposedProblem.createdAt}</p>
        <p>Cleared at: {proposedProblem.solvedAt ?? null}</p>
        <p>{actionData?.error.message}</p>
        <Form method="post">
          <button type="submit">Finish</button>
        </Form>
      </div>
    </>
  );
}
