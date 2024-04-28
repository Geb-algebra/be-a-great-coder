import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  LaboratoryRepository,
  ResearchFactory,
  TurnRepository,
} from "~/game/lifecycle/game.server.ts";
import type { Problem } from "~/game/models/game";
import { getNextTurn, getProblemsMatchUserRank } from "~/game/services/game.server.ts";
import { ResearchJsonifier } from "~/game/services/jsonifier";
import { authenticator } from "~/services/auth.server.ts";
import { getRequiredStringFromFormData } from "~/utils/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  const laboratory = await LaboratoryRepository.get(user.id);
  const currentResearch = laboratory.getUnfinishedResearch();
  if (currentResearch) {
    return redirect("/play/solve-problems");
  }
  {
    const candidateResearches = laboratory.getCandidateResearches();
    if (candidateResearches.length > 0) {
      return json(candidateResearches.map(ResearchJsonifier.toJson));
    }
  }
  const problems = await getProblemsMatchUserRank(laboratory.researcherRank);
  for (const problem of problems) {
    const research = await ResearchFactory.create(user.id, problem.id);
    laboratory.researches.push(research);
  }
  await LaboratoryRepository.save(user.id, laboratory);
  const candidateResearches = laboratory.getCandidateResearches();
  return json(candidateResearches.map(ResearchJsonifier.toJson));
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  try {
    const laboratory = await LaboratoryRepository.get(user.id);
    const currentResearch = laboratory.getUnfinishedResearch();
    if (currentResearch) {
      return redirect("/play/solve-problems");
    }
    const formData = await request.formData();
    const acceptedResearchId = getRequiredStringFromFormData(formData, "researchId");
    const acceptedResearch = laboratory.researches.find((r) => r.id === acceptedResearchId);
    if (!acceptedResearch) {
      throw new Response("Research not found", { status: 404 });
    }
    acceptedResearch.startedAt = new Date();
    laboratory.researches = laboratory.researches.filter(
      (r) => r.id !== acceptedResearchId || r.startedAt !== null,
    );

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

function ProblemCard(props: { problem: Problem }) {
  return (
    <div>
      <p>{props.problem.title}</p>
      <p>{props.problem.difficulty}</p>
    </div>
  );
}

export default function Page() {
  const researchJsons = useLoaderData<typeof loader>();
  const researches = researchJsons.map(ResearchJsonifier.fromJson);
  const actionData = useActionData<typeof action>();
  return (
    <div>
      <h1 className="font-bold text-2xl">Select A Problem to solve</h1>
      <Form method="post" className="flex">
        <p>{actionData?.error.message}</p>
        {researches.map((research) => (
          <button key={research.id} type="submit" name="researchId" value={research.id}>
            <ProblemCard key={research.id} problem={research.problem} />
          </button>
        ))}
      </Form>
    </div>
  );
}
