import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, Form, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/accounts/services/auth.server.ts';
import { queryRandomProblemByDifficulty } from '~/atcoder-info/models/problem.server.ts';
import { getProblemSolvedTime } from '~/atcoder-info/services/atcoder.server.ts';
import { ObjectNotFoundError } from '~/errors.ts';
import {
  ProposedProblemFactory,
  ProposedProblemRepository,
  TurnRepository,
} from '~/game/lifecycle/game.server.ts';
import { getNextTurn } from '~/game/services/game.server.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const turn = await TurnRepository.getOrThrow(user.id);
  if (turn !== 'solve-problems') {
    return redirect('/play/router');
  }
  const currentProposedProblem = await ProposedProblemRepository.getUnfinished(user.id);
  if (currentProposedProblem) {
    const problemSolvedTime = await getProblemSolvedTime(
      currentProposedProblem.problem.id,
      user.name,
      currentProposedProblem.createdAt.getTime(),
    );
    if (problemSolvedTime) {
      currentProposedProblem.finishedAt = problemSolvedTime;
      await ProposedProblemRepository.save(currentProposedProblem);
    }
    return json(currentProposedProblem);
  }
  const problem = await queryRandomProblemByDifficulty(100);
  const proposedProblem = await ProposedProblemFactory.createAndSave(user.id, problem);
  return json(proposedProblem);
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
  const proposedProblem = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <div>
      <h1 className="font-bold text-2xl">Solve Problems</h1>
      <p>{proposedProblem.problem.title}</p>
      <p>{proposedProblem.problem.difficulty}</p>
      <p>started at: {proposedProblem.createdAt}</p>
      <p>Cleared at: {proposedProblem.solvedAt ?? null}</p>
      <p>{actionData?.error.message}</p>
      <Form method="post">
        <button type="submit">Finish</button>
      </Form>
    </div>
  );
}
