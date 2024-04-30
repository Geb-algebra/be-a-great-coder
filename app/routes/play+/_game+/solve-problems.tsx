import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { getProblemSubmittedAndSolvedTime } from "~/atcoder-info/services/atcoder.server";
import ErrorDisplay from "~/components/ErrorDisplay";
import { ResearchInfo } from "~/components/ResearchInfo";
import { ResearchStatus } from "~/components/ResearchStatus";
import TurnHeader from "~/components/TurnHeader";
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

export function StatusText(props: { prefix: string; time: Date | null; fallBackMessage: string }) {
  function timeToText(time: Date) {
    return `${time.getFullYear()}/${
      time.getMonth() + 1
    }/${time.getDate()} ${time.toLocaleTimeString()}`;
  }
  return (
    <p>
      {props.time?.toISOString()
        ? `${props.prefix}: ${timeToText(props.time)}`
        : props.fallBackMessage}
    </p>
  );
}

export default function Page() {
  const { currentResearchJson } = useLoaderData<typeof loader>();
  const currentResearch = ResearchJsonifier.fromJson(currentResearchJson);
  const actionData = useActionData<typeof action>();
  return (
    <div className="bg-lab-base">
      <ErrorDisplay message={actionData?.error.message ?? ""} />
      <TurnHeader title="Solve The Problem" finishButtonName="Finish" />
      <ResearchInfo research={currentResearch} />
      <ResearchStatus research={currentResearch} />
    </div>
  );
}
