import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { ObjectNotFoundError } from "~/errors.ts";
import {
  LaboratoryRepository,
  TotalAssetsRepository,
  TurnRepository,
} from "~/game/lifecycle/game.server.ts";
import { calcRobotGrowthRate } from "~/game/services/config";
import { TotalAssetsUpdateService, getNextTurn } from "~/game/services/game.server.ts";
import { ResearchJsonifier } from "~/game/services/jsonifier";
import { authenticator } from "~/services/auth.server.ts";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  const laboratory = await LaboratoryRepository.get(user.id);
  const unrewardedResearch = laboratory.getUnrewardedResearch();
  if (!unrewardedResearch) {
    TurnRepository.save(user.id, getNextTurn(await TurnRepository.getOrThrow(user.id)));
    return redirect("/play/router");
  }
  return json({ unrewardedResearchJson: ResearchJsonifier.toJson(unrewardedResearch) });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  try {
    const laboratory = await LaboratoryRepository.get(user.id);
    const currentResearch = laboratory.getUnrewardedResearch();
    if (!currentResearch) {
      throw new ObjectNotFoundError("unrewarded proposedProblem not found");
    }
    currentResearch.rewardReceivedAt = new Date();
    await LaboratoryRepository.save(user.id, laboratory);
    const totalAssets = await TotalAssetsRepository.getOrThrow(user.id);
    const newAssets = TotalAssetsUpdateService.chargeBattery(
      totalAssets,
      laboratory.batteryCapacity,
    );
    await TotalAssetsRepository.save(user.id, newAssets);
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
  const { unrewardedResearchJson } = useLoaderData<typeof loader>();
  const unrewardedResearch = ResearchJsonifier.fromJson(unrewardedResearchJson);
  const actionData = useActionData<typeof action>();

  return (
    <>
      <div>
        <h1 className="font-bold text-2xl">Get Reward</h1>
        <p>{unrewardedResearch.problem.title}</p>
        <p>{unrewardedResearch.problem.difficulty}</p>
        <p>started at: {unrewardedResearch.createdAt.toISOString()}</p>
        <p>Submitted?: {String(!!unrewardedResearch.submittedAt)}</p>
        <p>Cleared?: {String(!!unrewardedResearch.solvedAt)}</p>
        <p>{actionData?.error.message}</p>
        <Form method="post" action="show-answer">
          <button type="submit">Show Answer</button>
        </Form>
        <Form method="post">
          <button type="submit">Get Reward</button>
        </Form>
      </div>
    </>
  );
}
