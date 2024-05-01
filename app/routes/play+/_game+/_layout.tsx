import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { useContext } from "react";
import { ThemeContext } from "~/Contexts";
import GameStatusDashboard from "~/components/GameStatusDashboard";
import { LaboratoryRepository } from "~/game/lifecycle/game.server";
import { TotalAssets } from "~/game/models/game";
import { getOrInitializeTotalAssets, getOrInitializeTurn } from "~/game/services/game.server";
import { authenticator } from "~/services/auth.server.ts";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  });
  const turn = await getOrInitializeTurn(user.id);
  const urlSegments = request.url.split("/");
  if (
    urlSegments[urlSegments.length - 2] === "play" &&
    urlSegments[urlSegments.length - 1] !== "router"
  ) {
    // if the user is at one of the turn pages
    const pageTurn = urlSegments[urlSegments.length - 1];
    if (pageTurn !== turn) {
      throw redirect("/play/router");
    }
  }
  const totalAssets = await getOrInitializeTotalAssets(user.id);
  const laboratory = await LaboratoryRepository.get(user.id);
  return {
    totalAssetsJson: {
      cash: totalAssets.cash,
      battery: totalAssets.battery,
      ingredientStock: totalAssets.ingredientStock,
    },
    laboratoryValue: laboratory.laboratoryValue,
  };
}

export default function Page() {
  const { totalAssetsJson, laboratoryValue } = useLoaderData<typeof loader>();
  const totalAssets = new TotalAssets(
    totalAssetsJson.cash,
    totalAssetsJson.battery,
    totalAssetsJson.ingredientStock,
  );
  const theme = useContext(ThemeContext);
  return (
    <div className="h-full flex flex-col">
      <GameStatusDashboard
        totalAssets={totalAssets}
        laboratoryValue={laboratoryValue}
        theme={theme}
      />
      <div className="bg-factory-base rounded-t-[24px_12px] py-4 px-6 grow overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
