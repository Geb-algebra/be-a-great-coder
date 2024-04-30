import { createId } from "@paralleldrive/cuid2";
import { createRemixStub } from "@remix-run/testing";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import invariant from "tiny-invariant";
import type { Account } from "~/accounts/models/account.ts";
import { prisma } from "~/db.server.ts";
import {
  LaboratoryRepository,
  ResearchFactory,
  TurnRepository,
} from "~/game/lifecycle/game.server.ts";
import {
  beginnersStatus,
  initialStatus,
  setBeginnersStatus,
  setInitialStatus,
  setVeteransStatus,
  veteransStatus,
} from "~/routes/test/data.ts";
import { addAuthenticationSessionTo, authenticated, setupAccount } from "~/routes/test/utils.tsx";
import Layout, { loader as layoutLoader } from "./_layout.tsx";
import { loader as buyLoader } from "./buy-ingredients.tsx";
import { action as showAnswerAction } from "./get-reward.show-answer.tsx";
import Component, { loader, action } from "./get-reward.tsx";
import { loader as routerLoader } from "./router.tsx";

const RemixStub = createRemixStub([
  {
    path: "/play",
    loader: authenticated(layoutLoader),
    Component: Layout,
    children: [
      {
        path: "/play/get-reward",
        loader: authenticated(loader),
        action: authenticated(action),
        Component,
        children: [
          {
            path: "/play/get-reward/show-answer",
            action: authenticated(showAnswerAction),
          },
        ],
      },
      {
        path: "/play/router",
        loader: authenticated(routerLoader),
      },
      {
        path: "/play/buy-ingredients",
        loader: authenticated(buyLoader),
        Component: () => <div />,
      },
    ],
  },
]);

describe.each([
  ["newcomers", setInitialStatus, initialStatus],
  ["beginners", setBeginnersStatus, beginnersStatus],
  ["veterans", setVeteransStatus, veteransStatus],
])("Page for %s", (_, statusSetter, status) => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "get-reward");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2021-12-31T00:00:00Z"));
    await statusSetter(account.id);
    vi.setSystemTime(new Date("2022-01-01T00:00:00Z"));
    const problem = await prisma.problem.create({
      data: {
        id: createId(),
        title: "testproblemtitle",
        difficulty: 300,
      },
    });
    const newResearch = await ResearchFactory.create(account.id, problem.id);
    newResearch.startedAt = new Date();
    newResearch.finishedAt = new Date();
    const lab = await LaboratoryRepository.get(account.id);
    lab.researches.push(newResearch);
    await LaboratoryRepository.forceSaveAllForTesting(account.id, lab);
    vi.useRealTimers();
  });

  it.each([
    [false, false],
    [true, false],
    [true, true],
  ])("renders the page with submitted=%s and solved=%s", async (submitted, solved) => {
    const laboratory = await LaboratoryRepository.get(account.id);
    const unrewardedResearch = laboratory.getUnrewardedResearch();
    invariant(unrewardedResearch, "unrewardedResearch should be defined");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2022-01-01T00:00:00Z"));
    if (submitted) unrewardedResearch.submittedAt = new Date();
    if (solved) unrewardedResearch.solvedAt = new Date();
    await LaboratoryRepository.forceSaveAllForTesting(account.id, laboratory);
    vi.useRealTimers();

    render(<RemixStub initialEntries={["/play/get-reward"]} />);
    await screen.findByRole("heading", { name: /get reward/i });
    await screen.findByText(/testproblemtitle/i);
    await screen.findByText(/difficulty: 300/i);
    await screen.findByText(/started at: 2022\/1\/1 9:00:00/i);
    if (submitted) {
      await screen.findByText(/submitted first at: 2022\/1\/1 9:00:00/i);
    } else {
      await screen.findByText(/not submitted yet/i);
    }
    if (solved) {
      await screen.findByText(/solved at: 2022\/1\/1 9:00:00/i);
    } else {
      await screen.findByText(/not solved yet/i);
    }
    await screen.findByText(/read an answer/i);
    await screen.findByRole("button", { name: /get reward/i });
  });

  it.todo.each([
    ["solved=False", false],
    ["solved=True", true],
  ])("gives reward on click get reward for %s", async (_, isSolved) => {
    if (isSolved) {
      const laboratory = await LaboratoryRepository.get(account.id);
      const unrewardedResearch = laboratory.getUnrewardedResearch();
      invariant(unrewardedResearch, "unrewardedResearch should be defined");
      unrewardedResearch.solvedAt = new Date();
      await LaboratoryRepository.forceSaveAllForTesting(account.id, laboratory);
    }
    render(<RemixStub initialEntries={["/play/get-reward"]} />);
    await screen.findByText(RegExp(`cash: ${status.totalAssets.cash}`, "i"));
    await screen.findByText(
      RegExp(
        `battery: ${status.totalAssets.battery} / ${status.laboratoryValue.batteryCapacity}`,
        "i",
      ),
    );
    await screen.findByText(
      RegExp(`robot performance: ${status.laboratoryValue.performance}`, "i"),
    );
    const getRewardButton = await screen.findByRole("button", { name: /get reward/i });
    const user = userEvent.setup();
    await user.click(getRewardButton);
    await screen.findByText(RegExp(`cash: ${status.totalAssets.cash}`, "i"));
    const newCapa = status.laboratoryValue.batteryCapacity + (isSolved ? 3 : 0); // 3 is difficulty / 100
    await screen.findByText(RegExp(`battery: ${newCapa} / ${newCapa}`, "i")); // fully charged
    await screen.findByText(
      RegExp(`robot performance: ${status.laboratoryValue.performance}`, "i"),
    ); // no change because the answer is not shown
  });

  it.todo.each([
    ["answerShown=False", false],
    ["answerShown=True", true],
  ])("gives reward on click get reward for %s", async (_, isShown) => {
    render(<RemixStub initialEntries={["/play/get-reward"]} />);
    await screen.findByText(RegExp(`cash: ${status.totalAssets.cash}`, "i"));
    await screen.findByText(
      RegExp(
        `battery: ${status.totalAssets.battery} / ${status.laboratoryValue.batteryCapacity}`,
        "i",
      ),
    );
    await screen.findByText(
      RegExp(`robot performance: ${status.laboratoryValue.performance}`, "i"),
    );
    const showAnswerbutton = await screen.findByRole("button", { name: /read an answer/i });
    const user = userEvent.setup();
    await user.click(showAnswerbutton);
    const getRewardButton = await screen.findByRole("button", { name: /get reward/i });
    await user.click(getRewardButton);
    await screen.findByText(RegExp(`cash: ${status.totalAssets.cash}`, "i"));
    const newCapa = status.laboratoryValue.batteryCapacity; // no change because the problem is not solved
    await screen.findByText(RegExp(`battery: ${newCapa} / ${newCapa}`, "i")); // fully charged
    await screen.findByText(
      RegExp(`robot performance: ${status.laboratoryValue.performance + (isShown ? 3 : 0)}`, "i"),
    );
  });
});

describe("action", () => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "get-reward");
    await setVeteransStatus(account.id);
    const problem = await prisma.problem.create({
      data: {
        id: createId(),
        title: "testproblemtitle",
        difficulty: 300,
      },
    });
    const newResearch = {
      id: createId(),
      problem,
      userId: account.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: new Date(),
      submittedAt: null,
      solvedAt: null,
      finishedAt: new Date(),
      answerShownAt: null,
      rewardReceivedAt: null,
      batteryCapacityIncrement: 3,
      performanceIncrement: 3,
    };
    const lab = await LaboratoryRepository.get(account.id);
    lab.researches.push(newResearch);
    await LaboratoryRepository.forceSaveAllForTesting(account.id, lab);
  });
  it("gives batteries if the problem is solved", async () => {
    const laboratory = await LaboratoryRepository.get(account.id);
    const unrewardedResearch = laboratory.getUnrewardedResearch();
    invariant(unrewardedResearch, "unrewardedResearch should be defined");
    unrewardedResearch.submittedAt = new Date();
    unrewardedResearch.solvedAt = new Date();
    await LaboratoryRepository.forceSaveAllForTesting(account.id, laboratory);

    const oldLab = await LaboratoryRepository.get(account.id);
    expect(oldLab.batteryCapacity).toBe(veteransStatus.laboratoryValue.batteryCapacity);

    const request = new Request("http://localhost:3000/play/get-reward", {
      method: "POST",
    });
    await addAuthenticationSessionTo(request);
    await action({ request, params: {}, context: {} });

    const updatedLaboratory = await LaboratoryRepository.get(account.id);
    const latestResearch = updatedLaboratory.researches.find((r) => r.id === unrewardedResearch.id);
    invariant(latestResearch, "solvedResearch should be defined");
    expect(latestResearch.rewardReceivedAt).toBeDefined();
    expect(updatedLaboratory.batteryCapacity).toBe(
      veteransStatus.laboratoryValue.batteryCapacity + 3,
    );
    expect(updatedLaboratory.performance).toBe(veteransStatus.laboratoryValue.performance);
  });

  it("gives performances if submitted and the explanation of the problem has displayed", async () => {
    const laboratory = await LaboratoryRepository.get(account.id);
    const unrewardedResearch = laboratory.getUnrewardedResearch();
    invariant(unrewardedResearch, "unrewardedResearch should be defined");
    unrewardedResearch.submittedAt = new Date();
    unrewardedResearch.answerShownAt = new Date();
    await LaboratoryRepository.forceSaveAllForTesting(account.id, laboratory);

    const oldLab = await LaboratoryRepository.get(account.id);
    expect(oldLab.batteryCapacity).toBe(veteransStatus.laboratoryValue.batteryCapacity);
    expect(oldLab.getUnrewardedResearch()?.solvedAt).toBeDefined();

    const request = new Request("http://localhost:3000/play/get-reward", {
      method: "POST",
    });
    await addAuthenticationSessionTo(request);
    await action({ request, params: {}, context: {} });

    const updatedLaboratory = await LaboratoryRepository.get(account.id);
    const solvedResearch = updatedLaboratory.researches.find((r) => r.id === unrewardedResearch.id);
    invariant(solvedResearch, "solvedResearch should be defined");
    expect(solvedResearch.rewardReceivedAt).toBeDefined();
    expect(updatedLaboratory.batteryCapacity).toBe(veteransStatus.laboratoryValue.batteryCapacity);
    expect(updatedLaboratory.performance).toBe(veteransStatus.laboratoryValue.performance + 3);
  });

  it("doesnt give performances if not submitted", async () => {
    const laboratory = await LaboratoryRepository.get(account.id);
    const unrewardedResearch = laboratory.getUnrewardedResearch();
    invariant(unrewardedResearch, "unrewardedResearch should be defined");
    // not submitted
    unrewardedResearch.answerShownAt = new Date();
    await LaboratoryRepository.forceSaveAllForTesting(account.id, laboratory);

    const oldLab = await LaboratoryRepository.get(account.id);
    expect(oldLab.batteryCapacity).toBe(veteransStatus.laboratoryValue.batteryCapacity);
    expect(oldLab.getUnrewardedResearch()?.solvedAt).toBeDefined();

    const request = new Request("http://localhost:3000/play/get-reward", {
      method: "POST",
    });
    await addAuthenticationSessionTo(request);
    await action({ request, params: {}, context: {} });

    const updatedLaboratory = await LaboratoryRepository.get(account.id);
    const solvedResearch = updatedLaboratory.researches.find((r) => r.id === unrewardedResearch.id);
    invariant(solvedResearch, "solvedResearch should be defined");
    expect(solvedResearch.rewardReceivedAt).toBeDefined();
    expect(updatedLaboratory.batteryCapacity).toBe(veteransStatus.laboratoryValue.batteryCapacity);
    expect(updatedLaboratory.performance).toBe(veteransStatus.laboratoryValue.performance);
  });
});
