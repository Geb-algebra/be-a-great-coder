import { createRemixStub } from "@remix-run/testing";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import invariant from "tiny-invariant";
import type { Account } from "~/accounts/models/account.ts";
import { TotalAssetsRepository, TurnRepository } from "~/game/lifecycle/game.server.ts";
import { TURNS, TotalAssets } from "~/game/models";
import { INGREDIENTS } from "~/game/services/config.ts";
import { setBeginnersStatus, setInitialStatus, setVeteransStatus } from "~/routes/test/data.ts";
import {
  assertCurrentCashIsEqualTo,
  assertCurrentIngredientStockIsEqualTo,
  authenticated,
  setupAccount,
} from "~/routes/test/utils.tsx";
import Layout, { loader as layoutLoader } from "./_layout.tsx";
import { action as buyAction } from "./buy-ingredients.$id.tsx";
import Page, { loader, action } from "./buy-ingredients.tsx";

const RemixStub = createRemixStub([
  {
    path: "/play",
    loader: authenticated(layoutLoader),
    Component: Layout,
    children: [
      {
        path: "/play/buy-ingredients",
        Component: Page,
        loader: authenticated(loader),
        action: authenticated(action),
        children: [...INGREDIENTS.keys()].map((id) => ({
          path: `/play/buy-ingredients/${id}`,
          action: (args) => authenticated(buyAction)({ ...args, params: { id: id } }),
        })),
      },
      {
        path: "/play/router",
        Component: () => <div>Test Succeeded 😆</div>,
      },
    ],
  },
]);

async function findBuyCard(ingredientName: string) {
  const content = await screen.findByRole("list", { name: /buy ingredients/i });
  return within(content).findByRole("listitem", {
    name: RegExp(ingredientName, "i"),
  });
}

async function buy(ingredientName: string, quantity: 1 | 10) {
  const item = await findBuyCard(ingredientName);
  const buyButton = await within(item).findByRole("button", { name: `+ ${quantity}` });
  const user = userEvent.setup();
  await user.click(buyButton);
}

describe.each([
  ["newcomers", setInitialStatus, 0],
  ["beginners", setBeginnersStatus, 16],
  ["veterans", setVeteransStatus, 128],
])("Page for %s", (_, statusSetter, ironAmount) => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "buy-ingredients");
    await statusSetter(account.id);
  });
  it("render all ingredients and buy1, buy10 and finish buying buttons", async () => {
    render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
    await screen.findByRole("heading", { name: /buy ingredients/i });
    for (const ingredient of INGREDIENTS.values()) {
      const ingrItem = await findBuyCard(ingredient.name);
      await within(ingrItem).findByRole("button", { name: /\+ 1$/i });
      await within(ingrItem).findByRole("button", { name: /\+ 10$/i });
    }
    await screen.findByRole("button", { name: /finish buying/i });
  });

  it.each([...INGREDIENTS.values()].map((i) => i.name))(
    "increases the quantity of %s when the button is clicked",
    async (name) => {
      const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
      const newAssets = new TotalAssets(
        10000000,
        totalAssets.battery,
        new Map(totalAssets.ingredientStock.entries()),
      );
      await TotalAssetsRepository.save(account.id, newAssets);
      render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
      const item = await findBuyCard(name);
      await assertCurrentIngredientStockIsEqualTo(name, ironAmount);
      await buy(name, 1);
      await assertCurrentIngredientStockIsEqualTo(name, ironAmount + 1);
      await buy(name, 10);
      await assertCurrentIngredientStockIsEqualTo(name, ironAmount + 11);
    },
  );

  it.each([...INGREDIENTS.values()].map((i) => i.name))(
    "increases the quantity of %s when the button is clicked, with just enough money",
    async (name) => {
      const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
      const ingredient = [...INGREDIENTS.values()].find((i) => i.name === name);
      const price = ingredient?.price;
      invariant(price !== undefined);
      const newAssets = new TotalAssets(
        price,
        totalAssets.battery,
        new Map(totalAssets.ingredientStock.entries()),
      );
      await TotalAssetsRepository.save(account.id, newAssets);
      render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);

      await assertCurrentIngredientStockIsEqualTo(name, ironAmount);
      await buy(name, 1);
      await assertCurrentCashIsEqualTo(0);
      await assertCurrentIngredientStockIsEqualTo(name, ironAmount + 1);
    },
  );

  it.each([...INGREDIENTS.values()].map((i) => i.name))(
    "display error if the user has not enough money",
    async (name) => {
      const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
      const newAssets = new TotalAssets(10, totalAssets.battery, totalAssets.ingredientStock);
      await TotalAssetsRepository.save(account.id, newAssets);
      render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
      await buy(name, 1);
      await screen.findByText(/not enough money/i);
      await buy(name, 10);
      await screen.findByText(/not enough money/i);
    },
  );

  it("redirects to /play/router after clicking the finish buying button", async () => {
    render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
    const finishButton = await screen.findByRole("button", { name: /finish buying/i });
    const user = userEvent.setup();
    await user.click(finishButton);
    await screen.findByText(/test succeeded/i);
  });
});
