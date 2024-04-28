import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { getProblemSubmittedAndSolvedTime } from "~/atcoder-info/services/atcoder.server";
import { ObjectNotFoundError } from "~/errors.ts";
import { LaboratoryRepository, TurnRepository } from "~/game/lifecycle/game.server.ts";
import { getNextTurn } from "~/game/services/game.server.ts";
import { ResearchJsonifier } from "~/game/services/jsonifier";
import { authenticator } from "~/services/auth.server.ts";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  const turn = await TurnRepository.getOrThrow(user.id);
  if (turn !== "solve-problems") {
    return redirect("/play/router");
  }
  const laboratory = await LaboratoryRepository.get(user.id);
  const currentResearch = laboratory.getUnfinishedResearch();
  if (!currentResearch) {
    throw new ObjectNotFoundError("unfinished research not found");
  }
  if (currentResearch.solvedAt && currentResearch.startedAt) {
    return json({ currentResearchJson: ResearchJsonifier.toJson(currentResearch) });
  }
  const { firstSubmittedAt, firstACAt } = await getProblemSubmittedAndSolvedTime(
    currentResearch.problem.id,
    user.name,
    Math.ceil(currentResearch.createdAt.getTime() / 1000),
  );
  if (currentResearch.submittedAt === null && firstSubmittedAt) {
    currentResearch.submittedAt = firstSubmittedAt;
  }
  if (currentResearch.solvedAt === null && firstACAt) {
    currentResearch.solvedAt = firstACAt;
  }
  await LaboratoryRepository.save(user.id, laboratory);
  return json({ currentResearchJson: ResearchJsonifier.toJson(currentResearch) });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  try {
    const laboratory = await LaboratoryRepository.get(user.id);
    const currentResearch = laboratory.getUnfinishedResearch();
    if (!currentResearch) {
      throw new ObjectNotFoundError("unfinished proposedProblem not found");
    }
    currentResearch.finishedAt = new Date();
    await LaboratoryRepository.save(user.id, laboratory);
    await TurnRepository.save(user.id, getNextTurn(await TurnRepository.getOrThrow(user.id)));
    return redirect("/play/router");
  } catch (error) {
    if (error instanceof Response && error.status >= 400) {
      return { error: (await error.json()) as { message: string } };
    }
    throw error;
  }
}

export const meta: MetaFunction = () => {
  return [{ title: "" }];
};

export default function Page() {
  const { currentResearchJson } = useLoaderData<typeof loader>();
  const currentResearch = ResearchJsonifier.fromJson(currentResearchJson);
  const actionData = useActionData<typeof action>();
  return (
    <div className="bg-lab-base">
      <h1 className="font-bold text-2xl">Solve The Problem</h1>
      <div className="flex">
        <p>{currentResearch.problem.title}</p>
        <a
          href={`https://atcoder.jp/contests/${currentResearch.problem.id.split("_")[0]}/tasks/${
            currentResearch.problem.id
          }`}
        >
          Go to Problem Page!
        </a>
      </div>
      <p>{currentResearch.problem.difficulty}</p>
      <p>Started at: {currentResearch.createdAt.toISOString()}</p>
      <p>Submitted first at: {currentResearch.submittedAt?.toISOString() ?? null}</p>
      <p>Cleared at: {currentResearch.solvedAt?.toISOString() ?? null}</p>
      <p>{actionData?.error.message}</p>
      <Form method="post">
        <button type="submit">Finish</button>
      </Form>
    </div>
  );
}
