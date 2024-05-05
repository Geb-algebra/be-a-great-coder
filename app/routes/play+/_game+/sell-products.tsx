import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useFetcher } from "@remix-run/react";
import ErrorDisplay from "~/components/ErrorDisplay.tsx";
import TurnHeader from "~/components/TurnHeader.tsx";
import { GameLogicViolated } from "~/errors.ts";
import { TurnRepository } from "~/game/lifecycle/game.server.ts";
import type { Product } from "~/game/models/game.ts";
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

function ProductInfo(props: { product: Product }) {
  return (
    <div className="w-36 bg-card rounded-lg">
      <div className=" w-full h-48 border border-border rounded-t-lg p-2">
        <h2 id={`product-${props.product.name}`} className="font-bold text-center">
          {props.product.name}
        </h2>
        <p>Ave: $ {props.product.priceAverage}</p>
        <p>Std: {props.product.priceStd}</p>
        <ul>
          {Array.from(props.product.ingredients).map((ingredient) => (
            <li key={ingredient[0]}>
              {ingredient[1]} {ingredient[0]}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="submit"
        className="h-12 border border-border w-full rounded-b-lg hover:bg-accent-1 hover:text-text-light transition-colors duration-300"
      >
        Make
      </button>
    </div>
  );
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher<typeof makeItemsAction>();

  return (
    <div>
      <TurnHeader title="Make and Sell Products" finishButtonName="Finish Making Products" />
      <ErrorDisplay message={actionData?.error.message ?? fetcher.data?.error?.message ?? ""} />
      <ul aria-labelledby="buy-ingredient-heading" className="flex gap-6">
        {PRODUCTS.map((product) => (
          <li aria-labelledby={`product-${product.name}`} key={product.name}>
            <fetcher.Form method="post" action={product.name}>
              <ProductInfo product={product} />
            </fetcher.Form>
          </li>
        ))}
      </ul>
    </div>
  );
}
