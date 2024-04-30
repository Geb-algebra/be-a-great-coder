import { createRemixStub } from "@remix-run/testing";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Account } from "~/accounts/models/account.ts";
import { TotalAssetsRepository, TurnRepository } from "~/game/lifecycle/game.server.ts";
import { PRODUCT_NAMES, TURNS, TotalAssets } from "~/game/models/game.ts";
import { INGREDIENTS, PRODUCTS } from "~/game/services/config.ts";
import * as Config from "~/game/services/config.ts";
import { setBeginnersStatus, setVeteransStatus } from "~/routes/test/data.ts";
import {
  assertCurrentBatteryIsEqualTo,
  assertCurrentCashIsEqualTo,
  assertCurrentIngredientStockIsEqualTo,
  authenticated,
  setupAccount,
} from "~/routes/test/utils.tsx";
import Layout, { loader as layoutLoader } from "./_layout.tsx";
import { action as sellAction } from "./sell-products.$name.tsx";
import Page, { action, loader } from "./sell-products.tsx";

const RemixStub = createRemixStub([
  {
    path: "/play",
    loader: authenticated(layoutLoader),
    Component: Layout,
    children: [
      {
        path: "/play/sell-products",
        loader: authenticated(loader),
        action: authenticated(action),
        Component: Page,
        children: PRODUCT_NAMES.map((name) => ({
          path: `/play/sell-products/${name}`,
          action: (args) => authenticated(sellAction)({ ...args, params: { name } }),
        })),
      },
      {
        path: "/play/router",
        Component: () => <div>Test Succeeded 😆</div>,
      },
    ],
  },
]);

describe.each([
  ["beginners", setBeginnersStatus, 1200, 16, 3],
  ["veterans", setVeteransStatus, 32768, 128, 136],
])("Page for %s", (_, statusSetter, cash, initIngredientAmount, battery) => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "sell-products");
    await statusSetter(account.id);
  });

  it("renders the page", async () => {
    render(<RemixStub initialEntries={["/play/sell-products"]} />);
    await screen.findByRole("heading", { name: /make and sell products/i });
    await screen.findByRole("button", { name: /finish making products/i });
  });

  it.each(PRODUCTS)("sells the item when the button is clicked", async (product) => {
    const spyon = vi.spyOn(Config, "calcPrice").mockImplementation(() => 1000);
    render(<RemixStub initialEntries={["/play/sell-products"]} />);
    await screen.findByText(RegExp(`\\$ ${cash}`, "i"));
    for (const [ingredient] of product.ingredients) {
      await assertCurrentIngredientStockIsEqualTo(ingredient, initIngredientAmount);
    }
    await assertCurrentBatteryIsEqualTo(battery);
    const item = await screen.findByRole("listitem", { name: RegExp(product.name, "i") });
    const makeSwordButton = await within(item).findByRole("button", { name: /make/i });
    const user = userEvent.setup();
    await user.click(makeSwordButton);
    // expect(spyon).toHaveBeenCalled();
    await assertCurrentCashIsEqualTo(cash + 1000);
    for (const [ingredient, quantity] of product.ingredients) {
      await assertCurrentIngredientStockIsEqualTo(ingredient, initIngredientAmount - quantity);
    }
    await assertCurrentBatteryIsEqualTo(battery - 1);
  });

  it.each(PRODUCTS)(
    "throws an error if the user doesnt have enough ingredients",
    async (product) => {
      const newAssets = new TotalAssets(
        cash,
        battery,
        new Map(INGREDIENTS.map((i) => [i.name, 0])),
      );
      await TotalAssetsRepository.save(account.id, newAssets);
      render(<RemixStub initialEntries={["/play/sell-products"]} />);
      const item = await screen.findByRole("listitem", { name: RegExp(product.name, "i") });
      const makeSwordButton = await within(item).findByRole("button", { name: /make/i });
      const user = userEvent.setup();
      await user.click(makeSwordButton);
      await screen.findByText(/not enough ingredients/i);
    },
  );

  it.each(PRODUCTS)("throws an error if the user doesnt have enough battery", async (product) => {
    const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
    const newAssets = new TotalAssets(cash, 0, totalAssets.ingredientStock);
    await TotalAssetsRepository.save(account.id, newAssets);
    render(<RemixStub initialEntries={["/play/sell-products"]} />);
    await assertCurrentBatteryIsEqualTo(0);
    const item = await screen.findByRole("listitem", { name: RegExp(product.name, "i") });
    const makeSwordButton = await within(item).findByRole("button", { name: /make/i });
    const user = userEvent.setup();
    await user.click(makeSwordButton);
    await screen.findByText(/not enough battery/i);
  });

  it("redirects to /play/router after clicking the finish buying button", async () => {
    render(<RemixStub initialEntries={["/play/sell-products"]} />);
    const finishButton = await screen.findByRole("button", { name: /finish making products/i });
    const user = userEvent.setup();
    await user.click(finishButton);
    await screen.findByText(/test succeeded/i);
  });
});
