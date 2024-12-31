import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { useActionData, useFetcher } from "@remix-run/react";
import Button from "~/components/Button.tsx";
import ErrorDisplay from "~/components/ErrorDisplay.tsx";
import TurnHeader from "~/components/TurnHeader.tsx";
import { GameLogicViolated } from "~/errors.ts";
import { TurnRepository } from "~/game/lifecycle/game.server.ts";
import type { Ingredient } from "~/game/models";
import { BASE_METALS, GEMS } from "~/game/services/config.ts";
import { getNextTurn } from "~/game/services/game.server.ts";
import { authenticator } from "~/services/auth.server.ts";
import type { action as makeItemsAction } from "./forge-swords.forge.tsx";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  return data({});
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  try {
    await TurnRepository.save(user.id, getNextTurn(await TurnRepository.getOrThrow(user.id)));
    return redirect("/play/router");
  } catch (error) {
    if (error instanceof GameLogicViolated) {
      return { error: { message: error.message } };
    }
    throw error;
  }
}

export const meta: MetaFunction = () => {
  return [{ title: "" }];
};

function IngredientSelector(props: {
  header: string;
  ingredients: Map<string, Ingredient>;
  radioName: string;
}) {
  // radio buttons for each ingredient
  return (
    <div className="w-48">
      <h3 className="w-full p-4 font-bold">{props.header}</h3>
      <fieldset className="w-full p-4 bg-card rounded-lg flex flex-col gap-2">
        {Array.from(props.ingredients.values()).map((ingredient) => (
          <label
            key={ingredient.id}
            className="block h-8 p-2 rounded-lg hover:bg-lab-accent-2 hover:text-lab-text-light has-[:checked]:bg-lab-accent-1 has-[:checked]:text-lab-text-light transition-colors duration-300 text-left content-center"
          >
            <input type="radio" name={props.radioName} value={ingredient.id} />
            {ingredient.name}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher<typeof makeItemsAction>();

  return (
    <div>
      <TurnHeader title="Forge and Sell Swords" finishButtonName="Finish Forging" />
      <ErrorDisplay message={actionData?.error.message ?? fetcher.data?.error?.message ?? ""} />
      <fetcher.Form method="post" action="forge" className="flex gap-12">
        <div className="flex gap-6">
          <IngredientSelector
            header="Base Metal"
            ingredients={BASE_METALS}
            radioName="baseMetalId"
          />
          <IngredientSelector header="Gem" ingredients={GEMS} radioName="gemId" />
        </div>
        <Button type="submit" className="px-8 py-4 h-fit my-auto">
          Forge Sword
        </Button>
      </fetcher.Form>
    </div>
  );
}
