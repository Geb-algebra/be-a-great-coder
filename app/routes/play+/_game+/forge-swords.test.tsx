import { createRemixStub } from "@remix-run/testing";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import invariant from "tiny-invariant";
import type { Account } from "~/accounts/models/account.ts";
import { TotalAssetsRepository, TurnRepository } from "~/game/lifecycle/game.server.ts";
import type { BaseMetal, Gem } from "~/game/models";
import { TotalAssets } from "~/game/models/game.ts";
import * as Config from "~/game/services/config.ts";
import { BASE_METALS, GEMS, INGREDIENTS } from "~/game/services/config.ts";
import { setBeginnersStatus, setVeteransStatus } from "~/routes/test/data.ts";
import {
  assertCurrentBatteryIsEqualTo,
  assertCurrentCashIsEqualTo,
  assertCurrentIngredientStockIsEqualTo,
  authenticated,
  setupAccount,
} from "~/routes/test/utils.tsx";
import Layout, { loader as layoutLoader } from "./_layout.tsx";
import { action as sellAction } from "./forge-swords.forge.tsx";
import Page, { action, loader } from "./forge-swords.tsx";

const RemixStub = createRemixStub([
  {
    path: "/play",
    loader: authenticated(layoutLoader),
    Component: Layout,
    children: [
      {
        path: "/play/forge-swords",
        loader: authenticated(loader),
        action: authenticated(action),
        Component: Page,
        children: [
          {
            path: "/play/forge-swords/forge",
            action: authenticated(sellAction),
          },
        ],
      },
      {
        path: "/play/router",
        Component: () => <div>Test Succeeded 😆</div>,
      },
    ],
  },
]);

function getBaseMetalAndGem() {
  const baseMetal = BASE_METALS.get("baseMetal1");
  invariant(baseMetal);
  const gem = GEMS.get("gemFire");
  invariant(gem);
  return [baseMetal, gem];
}

describe.each([
  ["beginners", setBeginnersStatus, 1200, 16, 3],
  ["veterans", setVeteransStatus, 32768, 128, 136],
])("Page for %s", (_, statusSetter, cash, initIngredientAmount, battery) => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "forge-swords");
    await statusSetter(account.id);
  });

  it("renders the page", async () => {
    render(<RemixStub initialEntries={["/play/forge-swords"]} />);
    await screen.findByRole("heading", { name: /Forge and sell swords/i });
    await screen.findByRole("button", { name: /finish forging/i });
  });

  it("sells the item when the button is clicked", async () => {
    vi.spyOn(Config, "calcSwordGrade").mockImplementation(() => {
      return { baseGrade: 1, bonusGrade: 1 };
    });
    vi.spyOn(Config, "calcSwordElement").mockImplementation(() => "fire");
    const [baseMetal, gem] = getBaseMetalAndGem();
    const expectedSword = Config.SWORDS.get("fire")?.[1];
    invariant(expectedSword);

    render(<RemixStub initialEntries={["/play/forge-swords"]} />);
    await assertCurrentCashIsEqualTo(cash);
    await assertCurrentIngredientStockIsEqualTo(baseMetal.name, initIngredientAmount);
    await assertCurrentIngredientStockIsEqualTo(gem.name, initIngredientAmount);
    await assertCurrentBatteryIsEqualTo(battery);
    const user = userEvent.setup();
    const baseMetalRadio = await screen.findByRole("radio", { name: RegExp(baseMetal.name, "i") });
    await user.click(baseMetalRadio);
    const gemRadio = await screen.findByRole("radio", { name: RegExp(gem.name, "i") });
    await user.click(gemRadio);
    const makeSwordButton = await screen.findByRole("button", { name: /forge sword/i });
    await user.click(makeSwordButton);
    await assertCurrentCashIsEqualTo(cash + expectedSword.price);
    await assertCurrentIngredientStockIsEqualTo(baseMetal.name, initIngredientAmount - 1);
    await assertCurrentIngredientStockIsEqualTo(gem.name, initIngredientAmount - 1);
    await assertCurrentBatteryIsEqualTo(battery - 1);
  });

  it("throws an error if the user doesnt have enough ingredients", async () => {
    const newAssets = new TotalAssets(
      cash,
      battery,
      new Map([...INGREDIENTS.keys()].map((id) => [id, 0])),
    );
    await TotalAssetsRepository.save(account.id, newAssets);
    const [baseMetal, gem] = getBaseMetalAndGem();
    render(<RemixStub initialEntries={["/play/forge-swords"]} />);
    const user = userEvent.setup();
    const baseMetalRadio = await screen.findByRole("radio", { name: RegExp(baseMetal.name, "i") });
    await user.click(baseMetalRadio);
    const gemRadio = await screen.findByRole("radio", { name: RegExp(gem.name, "i") });
    await user.click(gemRadio);
    const makeSwordButton = await screen.findByRole("button", { name: /forge sword/i });
    await user.click(makeSwordButton);
    await screen.findByText(/not enough base metals/i);
  });

  it("throws an error if the user doesnt have enough battery", async () => {
    const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
    const newAssets = new TotalAssets(cash, 0, totalAssets.ingredientStock);
    await TotalAssetsRepository.save(account.id, newAssets);
    const [baseMetal, gem] = getBaseMetalAndGem();
    render(<RemixStub initialEntries={["/play/forge-swords"]} />);
    const user = userEvent.setup();
    const baseMetalRadio = await screen.findByRole("radio", { name: RegExp(baseMetal.name, "i") });
    await user.click(baseMetalRadio);
    const gemRadio = await screen.findByRole("radio", { name: RegExp(gem.name, "i") });
    await user.click(gemRadio);
    const makeSwordButton = await screen.findByRole("button", { name: /forge sword/i });
    await user.click(makeSwordButton);
    await screen.findByText(/not enough battery/i);
  });

  it("redirects to /play/router after clicking the finish buying button", async () => {
    render(<RemixStub initialEntries={["/play/forge-swords"]} />);
    const finishButton = await screen.findByRole("button", { name: /finish forging/i });
    const user = userEvent.setup();
    await user.click(finishButton);
    await screen.findByText(/test succeeded/i);
  });
});
