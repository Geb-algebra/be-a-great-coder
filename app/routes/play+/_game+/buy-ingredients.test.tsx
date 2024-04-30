import { createRemixStub } from "@remix-run/testing";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Account } from "~/accounts/models/account.ts";
import { TotalAssetsRepository, TurnRepository } from "~/game/lifecycle/game.server.ts";
import { INGREDIENT_NAMES, type IngredientName, TURNS, TotalAssets } from "~/game/models/game.ts";
import { INGREDIENTS } from "~/game/services/config.ts";
import { setBeginnersStatus, setInitialStatus, setVeteransStatus } from "~/routes/test/data.ts";
import {
  assertCurrentCashIsEqualTo,
  assertCurrentIngredientStockIsEqualTo,
  authenticated,
  setupAccount,
} from "~/routes/test/utils.tsx";
import Layout, { loader as layoutLoader } from "./_layout.tsx";
import { action as buyAction } from "./buy-ingredients.$name.tsx";
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
        children: INGREDIENT_NAMES.map((name) => ({
          path: `/play/buy-ingredients/${name}`,
          action: (args) => authenticated(buyAction)({ ...args, params: { name } }),
        })),
      },
      {
        path: "/play/router",
        Component: () => <div>Test Succeeded 😆</div>,
      },
    ],
  },
]);

async function findBuyCard(ingredientName: IngredientName) {
  const content = await screen.findByRole("list", { name: /buy ingredients/i });
  return within(content).findByRole("listitem", {
    name: RegExp(ingredientName, "i"),
  });
}

async function buy(name: IngredientName, quantity: 1 | 10) {
  const item = await findBuyCard(name);
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
    for (const ingredient of INGREDIENTS) {
      const ingrItem = await findBuyCard(ingredient.name);
      await within(ingrItem).findByRole("button", { name: /\+ 1$/i });
      await within(ingrItem).findByRole("button", { name: /\+ 10$/i });
    }
    await screen.findByRole("button", { name: /finish buying/i });
  });

  it.each(INGREDIENTS.map((i) => i.name))(
    "increases the quantity of %s when the button is clicked",
    async (ingredientName) => {
      const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
      const newAssets = new TotalAssets(
        10000000,
        totalAssets.battery,
        new Map(totalAssets.ingredientStock.entries()),
      );
      await TotalAssetsRepository.save(account.id, newAssets);
      render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
      const item = await findBuyCard(ingredientName);
      await assertCurrentIngredientStockIsEqualTo(ingredientName, ironAmount);
      await buy(ingredientName, 1);
      await assertCurrentIngredientStockIsEqualTo(ingredientName, ironAmount + 1);
      await buy(ingredientName, 10);
      await assertCurrentIngredientStockIsEqualTo(ingredientName, ironAmount + 11);
    },
  );

  it.each(INGREDIENTS.map((i) => i.name))(
    "increases the quantity of %s when the button is clicked, with just enough money",
    async (ingredientName) => {
      const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
      const newAssets = new TotalAssets(
        INGREDIENTS.find((i) => i.name === ingredientName)?.price ?? 0,
        totalAssets.battery,
        new Map(totalAssets.ingredientStock.entries()),
      );
      await TotalAssetsRepository.save(account.id, newAssets);
      render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);

      await assertCurrentIngredientStockIsEqualTo(ingredientName, ironAmount);
      await buy(ingredientName, 1);
      await assertCurrentCashIsEqualTo(0);
      await assertCurrentIngredientStockIsEqualTo(ingredientName, ironAmount + 1);
    },
  );

  it.each(INGREDIENTS.map((i) => i.name))(
    "display error if the user has not enough money",
    async (ingredientName) => {
      const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
      const newAssets = new TotalAssets(10, totalAssets.battery, totalAssets.ingredientStock);
      await TotalAssetsRepository.save(account.id, newAssets);
      render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
      await buy(ingredientName, 1);
      await screen.findByText(/not enough money/i);
      await buy(ingredientName, 10);
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
