import { createRemixStub } from "@remix-run/testing";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Account } from "~/accounts/models/account.ts";
import { TotalAssetsRepository, TurnRepository } from "~/game/lifecycle/game.server.ts";
import { INGREDIENTS, INGREDIENT_NAMES, TURNS, TotalAssets } from "~/game/models/game.ts";
import { setBeginnersStatus, setInitialStatus, setVeteransStatus } from "~/routes/test/data.ts";
import { authenticated, setupAccount } from "~/routes/test/utils.ts";
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

describe.each([
  ["newcomers", setInitialStatus, 0],
  ["beginners", setBeginnersStatus, 16],
  ["veterans", setVeteransStatus, 128],
])("Page for %s", (_, statusSetter, ironAmount) => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "buy-ingredients");
  });
  it("render all ingredients and buy1, buy10 and finish buying buttons", async () => {
    await statusSetter(account.id);
    render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
    await screen.findByRole("heading", { name: /buy ingredients/i });
    for (const ingredient of INGREDIENTS) {
      const ingrItem = await screen.findByRole("listitem", { name: RegExp(ingredient.name, "i") });
      await within(ingrItem).findByRole("button", { name: /buy 1$/i });
      await within(ingrItem).findByRole("button", { name: /buy 10$/i });
    }
    await screen.findByRole("button", { name: /finish buying/i });
  });

  it.each(INGREDIENTS.map((i) => i.name))(
    "increases the quantity of %s when the button is clicked",
    async (ingredientName) => {
      await statusSetter(account.id);
      const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
      const newAssets = new TotalAssets(
        10000000,
        totalAssets.battery,
        new Map(totalAssets.ingredientStock.entries()),
      );
      await TotalAssetsRepository.save(account.id, newAssets);
      render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
      const item = await screen.findByRole("listitem", {
        name: RegExp(ingredientName, "i"),
      });
      await screen.findByText(RegExp(`${ingredientName}: ${ironAmount}`, "i"));
      const buy1Button = await within(item).findByRole("button", { name: /buy 1$/i });
      const user = userEvent.setup();
      await user.click(buy1Button);
      await screen.findByText(RegExp(`${ingredientName}: ${ironAmount + 1}`, "i"));
      const buy10Button = await within(item).findByRole("button", { name: /buy 10$/i });
      await user.click(buy10Button);
      await screen.findByText(RegExp(`${ingredientName}: ${ironAmount + 11}`, "i"));
    },
  );

  it.each(INGREDIENTS.map((i) => i.name))(
    "increases the quantity of %s when the button is clicked, with just enough money",
    async (ingredientName) => {
      await statusSetter(account.id);
      const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
      const newAssets = new TotalAssets(
        INGREDIENTS.find((i) => i.name === ingredientName)?.price ?? 0,
        totalAssets.battery,
        new Map(totalAssets.ingredientStock.entries()),
      );
      await TotalAssetsRepository.save(account.id, newAssets);
      render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
      const item = await screen.findByRole("listitem", {
        name: RegExp(ingredientName, "i"),
      });
      await screen.findByText(RegExp(`${ingredientName}: ${ironAmount}`, "i"));
      const buy1Button = await within(item).findByRole("button", { name: /buy 1$/i });
      const user = userEvent.setup();
      await user.click(buy1Button);
      await screen.findByText(/cash: 0/i);
      await screen.findByText(RegExp(`${ingredientName}: ${ironAmount + 1}`, "i"));
    },
  );

  it.each(INGREDIENTS.map((i) => i.name))(
    "display error if the user has not enough money",
    async (ingredientName) => {
      await statusSetter(account.id);
      const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
      const newAssets = new TotalAssets(10, totalAssets.battery, totalAssets.ingredientStock);
      await TotalAssetsRepository.save(account.id, newAssets);
      render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
      const item = await screen.findByRole("listitem", {
        name: RegExp(ingredientName, "i"),
      });
      const buy1Button = await within(item).findByRole("button", { name: /buy 1$/i });
      const user = userEvent.setup();
      await user.click(buy1Button);
      await screen.findByText(/not enough money/i);
      const buy10Button = await within(item).findByRole("button", { name: /buy 10$/i });
      await user.click(buy10Button);
      await screen.findByText(/not enough money/i);
    },
  );

  it.each(TURNS.filter((v) => v !== "buy-ingredients"))(
    "redirects to /play/router if the turn is %s",
    async (turn) => {
      await statusSetter(account.id);
      await TurnRepository.save(account.id, turn);
      render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
      await screen.findByText(/test succeeded/i);
    },
  );

  it("redirects to /play/router after clicking the finish buying button", async () => {
    await statusSetter(account.id);
    render(<RemixStub initialEntries={["/play/buy-ingredients"]} />);
    const finishButton = await screen.findByRole("button", { name: /finish buying/i });
    const user = userEvent.setup();
    await user.click(finishButton);
    await screen.findByText(/test succeeded/i);
  });
});
