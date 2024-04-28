import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { getProblemSubmittedAndSolvedTime } from "~/atcoder-info/services/atcoder.server";
import ErrorDisplay from "~/components/ErrorDisplay";
import TurnHeader from "~/components/TurnHeader";
import { ObjectNotFoundError } from "~/errors.ts";
import { LaboratoryRepository, TurnRepository } from "~/game/lifecycle/game.server.ts";
import type { Research } from "~/game/models/game";
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

function ResearchInfo(props: { research: Research }) {
  return (
    <div className="flex">
      <div className="w-96 h-48 p-6 rounded-lg bg-lab-card">
        <p className="text-xl font-bold mb-6">{props.research.problem.title}</p>
        <p>Difficulty: {props.research.problem.difficulty}</p>
        <p>battery: +{props.research.batteryCapacityIncrement}</p>
        <p>performance: +{props.research.performanceIncrement}</p>
      </div>
      <a
        href={`https://atcoder.jp/contests/${props.research.problem.id.split("_")[0]}/tasks/${
          props.research.problem.id
        }`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-4 mt-4 -ml-36 self-start rounded-lg bg-lab-accent-1 text-lab-text-light hover:bg-lab-accent-2 transition-colors duration-300"
      >
        Go to Problem Page!
      </a>
    </div>
  );
}

function StatusText(props: { prefix: string; time: Date | null; fallBackMessage: string }) {
  function timeToText(time: Date) {
    return `${time.getFullYear()}/${
      time.getMonth() + 1
    }/${time.getDate()} ${time.getHours()}:${time.getMinutes()}`;
  }
  return (
    <p>
      {props.time?.toISOString()
        ? `${props.prefix}: ${timeToText(props.time)}`
        : props.fallBackMessage}
    </p>
  );
}

function ResearchStatus(props: { research: Research }) {
  return (
    <div className="p-6">
      <StatusText
        prefix="Started At"
        time={props.research.startedAt}
        fallBackMessage="Not started yet"
      />
      <StatusText
        prefix="Submitted At"
        time={props.research.submittedAt}
        fallBackMessage="Not submitted yet"
      />
      <StatusText
        prefix="Solved At"
        time={props.research.solvedAt}
        fallBackMessage="Not solved yet"
      />
    </div>
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
