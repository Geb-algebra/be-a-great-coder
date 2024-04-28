import { type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { useContext } from "react";
import GameStatusDashboard from "~/components/GameStatusDashboard";
import { LaboratoryRepository } from "~/game/lifecycle/game.server";
import { getOrInitializeTotalAssets, getOrInitializeTurn } from "~/game/services/game.server";
import { TotalAssetsJsonifier } from "~/game/services/jsonifier";
import { authenticator } from "~/services/auth.server.ts";
import { ThemeContext } from "../../../Contexts";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  });
  const turn = await getOrInitializeTurn(user.id);
  const pageTurn = request.url.split("/").pop();
  if (pageTurn !== turn) {
    throw redirect("/play/router");
  }
  const totalAssets = await getOrInitializeTotalAssets(user.id);
  const laboratory = await LaboratoryRepository.get(user.id);
  return json({
    totalAssetsJson: TotalAssetsJsonifier.toJson(totalAssets),
    laboratoryValue: laboratory.laboratoryValue,
  });
}

export default function Page() {
  const { totalAssetsJson, laboratoryValue } = useLoaderData<typeof loader>();
  const totalAssets = TotalAssetsJsonifier.fromJson(totalAssetsJson);
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
