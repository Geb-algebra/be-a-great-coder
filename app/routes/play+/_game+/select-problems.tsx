import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import TurnHeader from "~/components/TurnHeader";
import {
  LaboratoryRepository,
  ResearchFactory,
  TurnRepository,
} from "~/game/lifecycle/game.server.ts";
import type { Research } from "~/game/models/game";
import { getNextTurn, getProblemsMatchUserRank } from "~/game/services/game.server.ts";
import { authenticator } from "~/services/auth.server.ts";
import { getRequiredStringFromFormData } from "~/utils/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  const laboratory = await LaboratoryRepository.get(user.id);
  const currentResearch = laboratory.getUnfinishedResearch();
  if (currentResearch) {
    throw redirect("/play/solve-problems");
  }
  {
    const candidateResearches = laboratory.getCandidateResearches();
    if (candidateResearches.length > 0) {
      return candidateResearches;
    }
  }
  const problems = await getProblemsMatchUserRank(laboratory.researcherRank);
  for (const problem of problems) {
    const research = await ResearchFactory.create(user.id, problem.id);
    laboratory.researches.push(research);
  }
  await LaboratoryRepository.save(user.id, laboratory);
  const candidateResearches = laboratory.getCandidateResearches();
  return candidateResearches;
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  try {
    const laboratory = await LaboratoryRepository.get(user.id);
    const currentResearch = laboratory.getUnfinishedResearch();
    if (currentResearch) {
      throw redirect("/play/solve-problems");
    }
    const formData = await request.formData();
    const acceptedResearchId = getRequiredStringFromFormData(formData, "researchId");
    const acceptedResearch = laboratory.researches.find((r) => r.id === acceptedResearchId);
    if (!acceptedResearch) {
      throw new Response("Research not found", { status: 404 });
    }
    acceptedResearch.startedAt = new Date();
    laboratory.researches = laboratory.researches.filter((r) => r.startedAt !== null);

    await LaboratoryRepository.save(user.id, laboratory);
    await TurnRepository.save(user.id, getNextTurn(await TurnRepository.getOrThrow(user.id)));
    throw redirect("/play/router");
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

function ResearchSelector(props: { research: Research }) {
  return (
    <button
      type="submit"
      name="researchId"
      value={props.research.id}
      className="w-48 h-48 p-4 bg-lab-card rounded-lg hover:bg-lab-accent-1 hover:text-lab-text-light transition-colors duration-300 text-left"
    >
      <p className="w-full text-center font-bold mb-8">{props.research.problem.title}</p>
      <p>Difficulty: {props.research.problem.difficulty}</p>
      <p>battery: +{props.research.batteryCapacityIncrement}</p>
      <p>performance: +{props.research.performanceIncrement}</p>
    </button>
  );
}

export default function Page() {
  const researches = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <div>
      <TurnHeader title="Select A Problem to Solve" />
      <Form method="post" className="flex">
        <p>{actionData?.error.message}</p>
        <ul className="flex gap-6">
          {researches.map((research) => (
            <li key={research.id}>
              <ResearchSelector research={research} />
            </li>
          ))}
        </ul>
      </Form>
    </div>
  );
}
