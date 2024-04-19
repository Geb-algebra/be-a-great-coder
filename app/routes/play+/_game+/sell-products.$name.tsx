import { type ActionFunctionArgs, json } from "@remix-run/node";
import { GameLogicViolated, ValueError } from "~/errors";
import { TotalAssetsRepository } from "~/game/lifecycle/game.server";
import { PRODUCTS } from "~/game/services/config";
import { TotalAssetsUpdateService } from "~/game/services/game.server";
import { authenticator } from "~/services/auth.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  });
  try {
    const productName = params.name;
    const product = PRODUCTS.find((product) => product.name === productName);
    if (!product) throw new ValueError(`Invalid item name: ${productName}`);
    const totalAssets = await TotalAssetsRepository.getOrThrow(user.id);
    const { newTotalAssets, price } = TotalAssetsUpdateService.makeAndSellProduct(
      totalAssets,
      product,
    );
    await TotalAssetsRepository.save(user.id, newTotalAssets);
    return json({ price, error: null });
  } catch (error) {
    if (error instanceof GameLogicViolated) {
      return { price: null, error: { message: error.message } };
    }
    throw error;
  }
}
