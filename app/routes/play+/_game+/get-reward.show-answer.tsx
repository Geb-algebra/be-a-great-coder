import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { ObjectNotFoundError } from "~/errors";
import { LaboratoryRepository } from "~/game/lifecycle/game.server";
import { authenticator } from "~/services/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  });
  const laboratory = await LaboratoryRepository.get(user.id);
  const currentResearch = laboratory.getUnrewardedResearch();
  if (!currentResearch) {
    throw new ObjectNotFoundError("unrewarded research not found");
  }
  if (currentResearch.answerShownAt === null) {
    currentResearch.answerShownAt = new Date();
    await LaboratoryRepository.updateUnrewardedResearch(user.id, laboratory);
  }
  return redirect("/play/router");
}
