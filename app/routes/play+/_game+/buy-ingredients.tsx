import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useFetcher } from "@remix-run/react";
import ErrorDisplay from "~/components/ErrorDisplay.tsx";
import TurnHeader from "~/components/TurnHeader.tsx";
import { GameLogicViolated } from "~/errors";
import { TurnRepository } from "~/game/lifecycle/game.server.ts";
import type { Ingredient, Product } from "~/game/models/game.ts";
import { INGREDIENTS, PRODUCTS } from "~/game/services/config.ts";
import { getNextTurn } from "~/game/services/game.server.ts";
import { authenticator } from "~/services/auth.server.ts";
import type { action as detailAction } from "./buy-ingredients.$name.tsx";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  return null;
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
    <div className="w-36 bg-factory-card rounded-lg">
      <div className=" w-full h-24 border border-factory-border rounded-t-lg p-2">
        <h2 id={`buy-${props.ingredient.name}`} className="font-bold text-center">
          {props.ingredient.name}
        </h2>
        <p>$ {props.ingredient.price}</p>
      </div>
      <div className="flex h-10">
        <button
          type="submit"
          name="quantity"
          value="1"
          className="border border-factory-border w-full rounded-bl-lg hover:bg-factory-accent-1 hover:text-factory-text-light transition-colors duration-300"
        >
          + 1
        </button>
        <button
          type="submit"
          name="quantity"
          value="10"
          className="border border-factory-border w-full rounded-br-lg hover:bg-factory-accent-1 hover:text-factory-text-light transition-colors duration-300"
        >
          + 10
        </button>
      </div>
    </div>
  );
}

function RecipeDisplayer(props: { product: Product }) {
  return (
    <div className="w-36 h-24 bg-factory-base rounded-lg">
      <div className=" w-full rounded-t-lg p-2">
        <h2 id={`product-name-${props.product}`} className="font-bold">
          {props.product.name}
        </h2>
      </div>
      <ul>
        {Array.from(props.product.ingredients).map((ingredient) => (
          <li key={ingredient[0]}>
            {ingredient[1]} {ingredient[0]}
          </li>
        ))}
      </ul>
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
        {INGREDIENTS.map((ingredient) => (
          <li aria-labelledby={`buy-${ingredient.name}`} key={ingredient.name}>
            <fetcher.Form method="post" action={ingredient.name}>
              <IngredientSeller ingredient={ingredient} />
            </fetcher.Form>
          </li>
        ))}
      </ul>
      <h2 className="font-bold mt-4">Required Ingredients to make items</h2>
      <ul className="flex gap-6">
        {PRODUCTS.map((product) => (
          <li aria-labelledby={`product-name-${product.name}`} key={product.name}>
            <RecipeDisplayer product={product} />
          </li>
        ))}
      </ul>
    </>
  );
}
