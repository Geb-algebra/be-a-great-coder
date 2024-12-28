import { type ActionFunctionArgs, data } from "@remix-run/node";
import { GameLogicViolated } from "~/errors";
import { TotalAssetsRepository } from "~/game/lifecycle/game.server";
import { BASE_METALS, GEMS } from "~/game/services/config";
import { TotalAssetsUpdateService } from "~/game/services/game.server";
import { authenticator } from "~/services/auth.server";
import { getRequiredStringFromFormData } from "~/utils/utils";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  });
  try {
    const formData = await request.formData();
    const baseMetalId = getRequiredStringFromFormData(formData, "baseMetalId");
    const baseMetal = BASE_METALS.get(baseMetalId);
    if (baseMetal === undefined)
      throw new GameLogicViolated(`Invalid base metal id: ${baseMetalId}`);
    const gemId = getRequiredStringFromFormData(formData, "gemId");
    const gem = GEMS.get(gemId);
    if (gem === undefined) throw new GameLogicViolated(`Invalid gem id: ${gemId}`);
    const totalAssets = await TotalAssetsRepository.getOrThrow(user.id);
    const { newTotalAssets, grade, element, sword } = TotalAssetsUpdateService.forgeAndSellSword(
      totalAssets,
      baseMetal,
      gem,
    );
    await TotalAssetsRepository.save(user.id, newTotalAssets);
    return data({ grade, element, sword, error: null });
  } catch (error) {
    if (error instanceof GameLogicViolated) {
      return {
        grade: null,
        element: null,
        sword: null,
        error: { message: error.message },
      };
    }
    throw error;
  }
}
