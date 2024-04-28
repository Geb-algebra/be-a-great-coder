import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useFetcher } from "@remix-run/react";
import { GameLogicViolated } from "~/errors.ts";
import { TurnRepository } from "~/game/lifecycle/game.server.ts";
import { PRODUCTS } from "~/game/services/config.ts";
import { getNextTurn } from "~/game/services/game.server.ts";
import { authenticator } from "~/services/auth.server.ts";
import type { action as makeItemsAction } from "./sell-products.$name.tsx";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/login" });
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
  const fetcher = useFetcher<typeof makeItemsAction>();

  return (
    <div>
      <h1 className="font-bold text-2xl">Make and sell products</h1>
      <p>{actionData?.error.message ?? fetcher.data?.error?.message ?? ""}</p>
      <ul>
        {PRODUCTS.map((product) => (
          <li aria-labelledby={`product-name-${product.name}`} key={product.name}>
            <fetcher.Form method="post" action={product.name}>
              <h3 id={`product-name-${product.name}`} className="text-bold">
                {product.name}
              </h3>
              <p>Ingredients:</p>
              <ul>
                {Array.from(product.ingredients).map(([ingredient, quantity]) => (
                  <li key={ingredient}>
                    {ingredient}: {quantity}
                  </li>
                ))}
              </ul>
              <button type="submit">Make</button>
            </fetcher.Form>
          </li>
        ))}
      </ul>
      <Form method="post">
        <button type="submit">Finish Making Products</button>
      </Form>
    </div>
  );
}
