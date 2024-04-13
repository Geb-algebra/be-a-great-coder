import Page, { action, loader } from "./select-problems.tsx";
import { loader as routerLoader } from "./router.tsx";
import solvePage, { loader as solveLoader } from "./solve-problems.tsx";
import { render, screen } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import { authenticated, setupAccount } from "~/routes/test/utils.ts";
import { setInitialStatus, setBeginnersStatus, setVeteransStatus } from "~/routes/test/data.ts";
import { TurnRepository } from "~/game/lifecycle/game.server.ts";
import type { Account } from "~/accounts/models/account.ts";
import userEvent from "@testing-library/user-event";
import { TURNS } from "~/game/models/game.ts";

const RemixStub = createRemixStub([
  {
    path: "/play/select-problems",
    loader: authenticated(loader),
    action: authenticated(action),
    Component: Page,
  },
  {
    path: "/play/router",
    loader: authenticated(routerLoader),
    Component: () => <div>Test Succeeded 😆</div>,
  },
  {
    path: "/play/solve-problems",
    loader: authenticated(solveLoader),
    Component: solvePage,
  },
]);

describe.each([
  ["newcomers", setInitialStatus, [100, 200, 300]],
  ["beginners", setBeginnersStatus, [100, 200, 300]],
  ["veterans", setVeteransStatus, [800, 900, 1000]],
])("Page for %s", (_, statusSetter, difficulties) => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "select-problems");
    await statusSetter(account.id);
  });
  it("renders three problems that match the users rank", async () => {
    render(<RemixStub initialEntries={["/play/select-problems"]} />);
    await screen.findByRole("heading", { name: /select a problem to solve/i });
    for (const difficulty of difficulties) {
      await screen.findByRole("button", { name: RegExp(`${difficulty}`, "i") });
    }
  });
  it("redirects to the solve page when a problem is selected", async () => {
    render(<RemixStub initialEntries={["/play/select-problems"]} />);
    await screen.findByRole("heading", { name: /select a problem to solve/i });
    const button = await screen.findByRole("button", { name: RegExp(`${difficulties[0]}`, "i") });
    const user = userEvent.setup();
    await user.click(button);
    await screen.findByRole("heading", { name: /solve the problem/i });
    await screen.findByText(`${difficulties[0]}`);
  });

  it.each(TURNS.filter((v) => v !== "select-problems"))(
    "redirects to /play/router if the turn is %s",
    async (turn) => {
      await statusSetter(account.id);
      await TurnRepository.save(account.id, turn);
      const RemixStub2 = createRemixStub([
        {
          path: "/play/select-problems",
          loader: authenticated(loader),
          action: authenticated(action),
          Component: Page,
        },
        {
          path: "/play/router",
          Component: () => <div>Test Succeeded 😆</div>,
        },
      ]);
      render(<RemixStub2 initialEntries={["/play/select-problems"]} />);
      await screen.findByText(/test succeeded/i);
    },
  );
});
