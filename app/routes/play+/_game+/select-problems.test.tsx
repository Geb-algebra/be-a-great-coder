import { createRemixStub } from "@remix-run/testing";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Account } from "~/accounts/models/account.ts";
import { LaboratoryRepository, TurnRepository } from "~/game/lifecycle/game.server.ts";
import { TURNS } from "~/game/models/game.ts";
import {
  setBeginnersStatus,
  setInitialStatus,
  setVeteransStatus,
} from "~/routes/test/data.server.ts";
import {
  addAuthenticationSessionTo,
  authenticated,
  setupAccount,
} from "~/routes/test/utils.server.ts";
import { loader as routerLoader } from "./router.tsx";
import Page, { action, loader } from "./select-problems.tsx";
import solvePage, { loader as solveLoader } from "./solve-problems.tsx";

describe("loader", () => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "select-problems");
    await setVeteransStatus(account.id);
  });

  it("adds three candidate researches if the user has no current research", async () => {
    {
      const lab = await LaboratoryRepository.get(account.id);
      const researches = lab.getCandidateResearches();
      expect(researches).toHaveLength(0);
    }
    const request = new Request("http://localhost:3000/play/select-problems");
    await addAuthenticationSessionTo(request);
    const response = await loader({ request, params: {}, context: {} });
    const data = await response.json();
    expect(data).toHaveLength(3);
    const lab = await LaboratoryRepository.get(account.id);
    const researches = lab.getCandidateResearches();
    expect(researches).toHaveLength(3);
  });

  it("returns existing candidates if they exist", async () => {
    const request = new Request("http://localhost:3000/play/select-problems");
    await addAuthenticationSessionTo(request);
    const response = await loader({ request, params: {}, context: {} });
    const dataIds = await response.json().then((data) => data.map((r) => r.id));
    expect(dataIds).toHaveLength(3);
    const request2 = new Request("http://localhost:3000/play/select-problems");
    await addAuthenticationSessionTo(request2);
    const response2 = await loader({ request: request2, params: {}, context: {} });
    const dataIds2 = await response2.json().then((data) => data.map((r) => r.id));
    expect(dataIds2).toEqual(dataIds);
  });
});

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
