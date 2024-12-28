import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Form, useActionData, useFetcher } from "@remix-run/react";
import ErrorDisplay from "~/components/ErrorDisplay.tsx";
import TurnHeader from "~/components/TurnHeader.tsx";
import { GameLogicViolated } from "~/errors";
import { TurnRepository } from "~/game/lifecycle/game.server.ts";
import type { Ingredient } from "~/game/models";
import { INGREDIENTS } from "~/game/services/config.ts";
import { getNextTurn } from "~/game/services/game.server.ts";
import { authenticator } from "~/services/auth.server.ts";
import type { action as detailAction } from "./buy-ingredients.$id.tsx";

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

function IngredientSeller(props: { ingredient: Ingredient }) {
  return (
    <div className="w-36 bg-card rounded-lg">
      <div className="w-full h-24 border border-border rounded-t-lg p-2">
        <h2 id={`buy-${props.ingredient.id}`} className="font-bold text-center">
          {props.ingredient.name}
        </h2>
        <p>$ {props.ingredient.price}</p>
      </div>
      <div className="flex h-10">
        <button
          type="submit"
          name="quantity"
          value="1"
          className="border border-border w-full rounded-bl-lg hover:bg-accent-1 hover:text-text-light transition-colors duration-300"
        >
          + 1
        </button>
        <button
          type="submit"
          name="quantity"
          value="10"
          className="border border-border w-full rounded-br-lg hover:bg-accent-1 hover:text-text-light transition-colors duration-300"
        >
          + 10
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher<typeof detailAction>();
  return (
    <>
      <TurnHeader
        title="Buy Ingredients"
        titleId="buy-ingredient-heading"
        finishButtonName="Finish Buying"
      />
      <ErrorDisplay message={actionData?.error.message ?? fetcher.data?.error.message ?? ""} />
      <ul aria-labelledby="buy-ingredient-heading" className="flex gap-6">
        {[...INGREDIENTS.values()].map((ingredient) => (
          <li aria-labelledby={`buy-${ingredient.id}`} key={ingredient.id}>
            <fetcher.Form method="post" action={ingredient.id}>
              <IngredientSeller ingredient={ingredient} />
            </fetcher.Form>
          </li>
        ))}
      </ul>
    </>
  );
}
