import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, Form, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server.ts';
import {
  LaboratoryRepository,
  ResearchFactory,
  TotalAssetsRepository,
  TurnRepository,
} from '~/game/lifecycle/game.server.ts';
import { getNextTurn, getProblemsMatchUserRank } from '~/game/services/game.server.ts';
import { LaboratoryJsonifier, TotalAssetsJsonifier } from '~/game/services/jsonifier';
import GameStatusDashboard from '~/components/GameStatusDashboard';
import { Problem } from '~/game/models/game';
import { getRequiredStringFromFormData } from '~/utils/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  const turn = await TurnRepository.getOrThrow(user.id);
  if (turn !== 'select-problems') {
    return redirect('/play/router');
  }
  const laboratory = await LaboratoryRepository.get(user.id);
  const totalAssets = await TotalAssetsRepository.getOrThrow(user.id);
  const currentResearch = laboratory.getUnfinishedResearch();
  if (currentResearch) {
    return redirect('/play/solve-problems');
  }
  const problems = await getProblemsMatchUserRank(laboratory.researcherRank);
  return json({
    laboratoryJson: LaboratoryJsonifier.toJson(laboratory),
    totalAssetsJson: TotalAssetsJsonifier.toJson(totalAssets),
    problems,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: '/login' });
  try {
    const laboratory = await LaboratoryRepository.get(user.id);
    const currentResearch = laboratory.getUnfinishedResearch();
    if (currentResearch) {
      return redirect('/play/solve-problems');
    }
    const formData = await request.formData();
    const problemId = getRequiredStringFromFormData(formData, 'problemId');
    const newResearch = await ResearchFactory.create(user.id, problemId);
    laboratory.researches.push(newResearch);
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

function Problem(props: { problem: Problem }) {
  return (
    <div>
      <p>{props.problem.title}</p>
      <p>{props.problem.difficulty}</p>
    </div>
  );
}

export default function Page() {
  const { laboratoryJson, totalAssetsJson, problems } = useLoaderData<typeof loader>();
  const laboratory = LaboratoryJsonifier.fromJson(laboratoryJson);
  const totalAssets = TotalAssetsJsonifier.fromJson(totalAssetsJson);
  const actionData = useActionData<typeof action>();
  return (
    <>
      <GameStatusDashboard totalAssets={totalAssets} laboratoryValue={laboratory.laboratoryValue} />
      <div>
        <h1 className="font-bold text-2xl">Select Problems to solve</h1>
        <Form method="post" className="flex">
          <p>{actionData?.error.message}</p>
          {problems.map((problem) => (
            <button key={problem.id} type="submit" name="problemId" value={problem.id}>
              <Problem key={problem.id} problem={problem} />
            </button>
          ))}
        </Form>
      </div>
    </>
  );
}
