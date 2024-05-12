import type { ActionFunctionArgs } from "@remix-run/node";
import { ObjectNotFoundError } from "~/errors";
import { LaboratoryRepository } from "~/game/lifecycle/game.server";
import { authenticator } from "~/services/auth.server";
import { getRequiredStringFromFormData } from "~/utils/utils";

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  if (process.env.NODE_ENV !== "development") {
    throw new Error("This action is only available in development mode");
  }
  try {
    const formData = await request.formData();
    const intent = getRequiredStringFromFormData(formData, "intent");
    const laboratory = await LaboratoryRepository.get(user.id);
    const currentResearch = laboratory.getUnfinishedResearch();
    if (!currentResearch) {
      throw new ObjectNotFoundError("unfinished proposedProblem not found");
    }
    if (intent === "submit") {
      currentResearch.submittedAt = new Date();
    } else if (intent === "solve") {
      currentResearch.submittedAt = currentResearch.submittedAt || new Date();
      currentResearch.solvedAt = new Date();
    } else {
      throw new Error(`Invalid intent: ${intent}`);
    }
    await LaboratoryRepository.save(user.id, laboratory);
    return null;
  } catch (error) {
    if (error instanceof Response && error.status >= 400) {
      return { error: (await error.json()) as { message: string } };
    }
    throw error;
  }
}
