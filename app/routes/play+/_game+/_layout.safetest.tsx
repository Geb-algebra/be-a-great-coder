import { createRemixStub } from "@remix-run/testing";
import { render } from "safetest/react";
import { describe, expect, it } from "safetest/vitest";
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
} from "~/routes/test/data.server.ts";
import { authenticated, setupAccount } from "../../test/utils.server.ts";
import Page, { loader } from "./_layout.tsx";

const RemixStub = createRemixStub([
  {
    path: "",
    loader: authenticated(loader),
    Component: Page,
  },
]);

describe("Page", () => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "buy-ingredients");
  });
  it("should return the expected data for %s", async () => {
    const setter = setVeteransStatus;
    const expected = veteransStatus;
    await setter(account.id);
    const { page } = await render(<RemixStub />);
    await expect(
      page.locator(`text=Researcher's Rank: ${expected.laboratoryValue.researcherRank}`),
    ).toBeVisible();
    await expect(page.locator(`text=Cash: ${expected.totalAssets.cash}`)).toBeVisible();
    for (const ingredient of INGREDIENT_NAMES) {
      await expect(
        page.locator(`text=${ingredient}: ${expected.totalAssets.ingredientStock.get(ingredient)}`),
      ).toBeVisible();
    }
    await expect(
      page.locator(
        `text=Battery: ${expected.totalAssets.battery} / ${expected.laboratoryValue.batteryCapacity}`,
      ),
    ).toBeVisible();
    await expect(
      page.locator(`text=Robot Performance: ${expected.laboratoryValue.performance}`),
    ).toBeVisible();
  });
});
