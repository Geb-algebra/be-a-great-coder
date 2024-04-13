import type { ActionFunctionArgs } from "@remix-run/node";
import { GameLogicViolated, ValueError } from "~/errors";
import { TotalAssetsRepository } from "~/game/lifecycle/game.server";
import { TotalAssetsUpdateService } from "~/game/services/game.server";
import { authenticator } from "~/services/auth.server";
import { getRequiredStringFromFormData } from "~/utils/utils";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  try {
    const ingredientName = params.name;
    if (!ingredientName) throw new ValueError("Ingredient name is required");
    const formData = await request.formData();
    const quantity = Number(getRequiredStringFromFormData(formData, "quantity"));
    const totalAssets = await TotalAssetsRepository.getOrThrow(user.id);
    const newTotalAssets = TotalAssetsUpdateService.buyIngredients(
      totalAssets,
      ingredientName,
      quantity,
    );
    await TotalAssetsRepository.save(user.id, newTotalAssets);
    return null;
  } catch (error) {
    if (error instanceof GameLogicViolated) {
      return { error: { message: error.message } };
    }
    throw error;
  }
}
