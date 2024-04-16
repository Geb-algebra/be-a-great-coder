import { createRemixStub } from "@remix-run/testing";
import { render, screen } from "@testing-library/react";
import type { Account } from "~/accounts/models/account";
import { TurnRepository } from "~/game/lifecycle/game.server";
import { INGREDIENT_NAMES } from "~/game/models/game.ts";
import {
  beginnersStatus,
  initialStatus,
  setBeginnersStatus,
  setInitialStatus,
  setVeteransStatus,
  veteransStatus,
} from "~/routes/test/data.ts";
import { authenticated, setupAccount } from "../../test/utils.ts";
import Page, { loader } from "./_layout";

describe("Page", () => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "buy-ingredients");
  });
  it.each([
    ["newcomers", setInitialStatus, initialStatus],
    ["beginners", setBeginnersStatus, beginnersStatus],
    ["veterans", setVeteransStatus, veteransStatus],
  ])("should return the expected data for %s", async (_, setter, expected) => {
    await setter(account.id);
    const RemixStub = createRemixStub([
      {
        path: "",
        loader: authenticated(loader),
        Component: Page,
      },
    ]);
    render(<RemixStub />);
    expect(
      await screen.findByText(
        RegExp(`researcher's rank: ${expected.laboratoryValue.researcherRank}`, "i"),
      ),
    );
    expect(await screen.findByText(RegExp(`cash: ${expected.totalAssets.cash}`, "i")));
    for (const ingredient of INGREDIENT_NAMES) {
      expect(
        await screen.findByText(
          RegExp(`${ingredient}: ${expected.totalAssets.ingredientStock.get(ingredient)}`, "i"),
        ),
      );
    }
    expect(
      await screen.findByText(
        RegExp(
          `battery: ${expected.totalAssets.battery} / ${expected.laboratoryValue.batteryCapacity}`,
          "i",
        ),
      ),
    );
    expect(
      await screen.findByText(
        RegExp(`robot performance: ${expected.laboratoryValue.performance}`, "i"),
      ),
    );
  });
});
