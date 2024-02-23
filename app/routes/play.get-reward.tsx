import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, Form, useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { authenticator } from '~/accounts/services/auth.server.ts';
import { ObjectNotFoundError } from '~/errors.ts';
import {
  GameStatusRepository,
  ProposedProblemRepository,
  TurnRepository,
} from '~/game/lifecycle/game.server.ts';
import { GameStatusUpdateService, getNextTurn } from '~/game/services/game.server.ts';
import { getRequiredStringFromFormData } from '~/utils.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const turn = await TurnRepository.getOrThrow(user.id);
  if (turn !== 'get-reward') {
    return redirect('/play/router');
  }
  const unrewardedProposedProblem = await ProposedProblemRepository.getRewardUnreceived(user.id);
  if (!unrewardedProposedProblem) {
    TurnRepository.save(user.id, getNextTurn(await TurnRepository.getOrThrow(user.id)));
    return redirect('/play/router');
  }
  return json(unrewardedProposedProblem);
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  try {
    const currentGameStatus = await GameStatusRepository.getOrThrow(user.id);
    let newStatus = GameStatusUpdateService.applyRobotUpgrades(currentGameStatus, 2);
    const formData = await request.formData();
    const answerShown = getRequiredStringFromFormData(formData, 'answer-shown') === 'true';
    if (answerShown) {
      newStatus = GameStatusUpdateService.applyRobotData(newStatus, 2);
    }
    const proposedProblem = await ProposedProblemRepository.getRewardUnreceived(user.id);
    if (!proposedProblem) {
      throw new ObjectNotFoundError('unfinished proposedProblem not found');
    }
    proposedProblem.rewardReceivedAt = new Date();
    await GameStatusRepository.save(user.id, newStatus);
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
  const [answerShown, setAnswerShown] = useState(false);

  return (
    <div>
      <h1 className="font-bold text-2xl">Get Reward</h1>
      <p>{proposedProblem.problem.title}</p>
      <p>{proposedProblem.problem.difficulty}</p>
      <p>started at: {proposedProblem.createdAt}</p>
      <p>Cleared?: {String(!!proposedProblem.solvedAt)}</p>
      <p>{actionData?.error.message}</p>
      <button disabled={answerShown} onClick={() => setAnswerShown(true)}>
        Show Answer
      </button>
      <Form method="post">
        <input type="hidden" name="answer-shown" value={String(answerShown)} />
        <button type="submit">Get Reward</button>
      </Form>
    </div>
  );
}
