import { createRemixStub } from "@remix-run/testing";
import { render, screen, within } from "@testing-library/react";
import type { Account } from "~/accounts/models/account";
import { TurnRepository } from "~/game/lifecycle/game.server";
import { TURNS } from "~/game/models/game.ts";
import { INGREDIENTS, calcLvAndResidual } from "~/game/services/config";
import {
  beginnersStatus,
  initialStatus,
  setBeginnersStatus,
  setInitialStatus,
  setVeteransStatus,
  veteransStatus,
} from "~/routes/test/data.ts";
import { authenticated, setupAccount } from "~/routes/test/utils.tsx";
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
      await screen.findByText(RegExp(`rank: ${expected.laboratoryValue.researcherRank}`, "i")),
    );
    expect(await screen.findByText(RegExp(`\\$ ${expected.totalAssets.cash}`, "i")));
    for (const ingredient of INGREDIENTS.values()) {
      const stock = await screen.findByRole("listitem", {
        name: RegExp(ingredient.name, "i"),
      });
      await within(stock).findByText(RegExp(ingredient.name, "i"));
      await within(stock).findByText(
        RegExp(`${expected.totalAssets.ingredientStock.get(ingredient.id)}`, "i"),
      );
    }
    expect(
      await screen.findByText(
        RegExp(
          `battery: ${expected.totalAssets.battery} / ${
            calcLvAndResidual(expected.laboratoryValue.batteryCapacityExp).lv
          }`,
          "i",
        ),
      ),
    );
    expect(
      await screen.findByText(
        RegExp(
          `robot performance: ${calcLvAndResidual(expected.laboratoryValue.performanceExp).lv}`,
          "i",
        ),
      ),
    );
  });
});

describe.each(TURNS)("Redirection on turn=%s", (turn) => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, turn);
  });
  it.each(TURNS.filter((t) => t !== turn))(
    "should redirect to /play/router if the current turn and the page mismatches",
    async (pageTurn) => {
      const RemixStub = createRemixStub([
        {
          path: `/play/${pageTurn}`,
          loader: authenticated(loader),
          Component: () => <div>stay on the page 😌</div>,
        },

        {
          path: "/play/router",
          Component: () => <div>Redirected 😆</div>,
        },
      ]);
      render(<RemixStub initialEntries={[`/play/${pageTurn}`]} />);
      await screen.findByText(/redirected/i);
    },
  );
  it("should render the page if the current turn and the page matches", async () => {
    const RemixStub = createRemixStub([
      {
        path: `/play/${turn}`,
        loader: authenticated(loader),
        Component: () => <div>stay on the page 😌</div>,
      },

      {
        path: "/play/router",
        Component: () => <div>Redirected 😆</div>,
      },
    ]);
    render(<RemixStub initialEntries={[`/play/${turn}`]} />);
    await screen.findByText(/stay on the page/i);
  });

  it("should render the index page", async () => {
    const RemixStub = createRemixStub([
      {
        path: "/play",
        loader: authenticated(loader),
        Component: () => <div>stay on the page 😌</div>,
      },

      {
        path: "/play/router",
        Component: () => <div>Redirected 😆</div>,
      },
    ]);
    render(<RemixStub initialEntries={["/play"]} />);
    await screen.findByText(/stay on the page/i);
  });
});
