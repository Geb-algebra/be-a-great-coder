import { type LoaderFunctionArgs, data, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import GameStatusDashboard from "~/components/GameStatusDashboard";
import { LaboratoryRepository } from "~/game/lifecycle/game.server";
import { getOrInitializeTotalAssets, getOrInitializeTurn } from "~/game/services/game.server";
import { TotalAssetsJsonifier } from "~/game/services/jsonifier";
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
  return data({
    totalAssetsJson: TotalAssetsJsonifier.toJson(totalAssets),
    laboratoryValue: laboratory.laboratoryValue,
  });
}

export default function Page() {
  const { totalAssetsJson, laboratoryValue } = useLoaderData<typeof loader>();
  const totalAssets = TotalAssetsJsonifier.fromJson(totalAssetsJson);
  return (
    <div className="h-full flex flex-col">
      <GameStatusDashboard totalAssets={totalAssets} laboratoryValue={laboratoryValue} />
      <main
        className="bg-base rounded-t-[24px_12px] py-4 px-6 grow overflow-auto"
        aria-label="game controller"
      >
        <Outlet />
      </main>
    </div>
  );
}
