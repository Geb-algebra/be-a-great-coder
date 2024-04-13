import { createRemixStub } from "@remix-run/testing";
import { render, screen } from "@testing-library/react";
import Page, { loader } from "./_layout";
import { TurnRepository } from "~/game/lifecycle/game.server";
import { authenticated, setupAccount } from "../../test/utils.ts";
import type { Account } from "~/accounts/models/account";
import {
  setBeginnersStatus,
  setInitialStatus,
  setVeteransStatus,
  initialJson,
  beginnersJson,
  veteransJson,
} from "~/routes/test/data.ts";

describe("Page", () => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "buy-ingredients");
  });
  it.each([
    ["newcomers", setInitialStatus, initialJson],
    ["beginners", setBeginnersStatus, beginnersJson],
    ["veterans", setVeteransStatus, veteransJson],
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
    expect(await screen.findByText(RegExp(`cash: ${expected.totalAssetsJson.cash}`, "i")));
    expect(
      await screen.findByText(
        RegExp(`iron: ${expected.totalAssetsJson.ingredientStock[0][1]}`, "i"),
      ),
    );
    expect(
      await screen.findByText(
        RegExp(
          `battery: ${expected.totalAssetsJson.battery} / ${expected.laboratoryValue.batteryCapacity}`,
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
