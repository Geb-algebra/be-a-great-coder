import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useFetcher } from "@remix-run/react";
import { GameLogicViolated } from "~/errors";
import { TurnRepository } from "~/game/lifecycle/game.server.ts";
import { INGREDIENTS } from "~/game/models/game.ts";
import { getNextTurn } from "~/game/services/game.server.ts";
import { authenticator } from "~/services/auth.server.ts";
import type { action as detailAction } from "./buy-ingredients.$name.tsx";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
  const turn = await TurnRepository.getOrThrow(user.id);
  if (turn !== "buy-ingredients") return redirect("/play/router");
  return json({});
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

export default function Page() {
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher<typeof detailAction>();
  return (
    <div>
      <h1 id="buy-ingredient-heading" className="font-bold text-2xl">
        Buy Ingredients
      </h1>
      <p>{actionData?.error.message ?? fetcher.data?.error.message}</p>
      <ul aria-labelledby="buy-ingredient-heading">
        {INGREDIENTS.map((ingredient) => (
          <li aria-labelledby={`ingredient-name-${ingredient.name}`} key={ingredient.name}>
            <h2 id={`ingredient-name-${ingredient.name}`} className="font-bold">
              {ingredient.name}
            </h2>
            <fetcher.Form method="post" action={ingredient.name}>
              <button type="submit" name="quantity" value="1">
                buy 1
              </button>
              <button type="submit" name="quantity" value="10">
                buy 10
              </button>
            </fetcher.Form>
          </li>
        ))}
      </ul>
      <Form method="post">
        <button type="submit">Finish Buying</button>
      </Form>
      <h2 className="font-bold mt-4">Required Ingredients to make items</h2>
      <ul>
        <li>Sword: 3 Irons</li>
      </ul>
    </div>
  );
}
