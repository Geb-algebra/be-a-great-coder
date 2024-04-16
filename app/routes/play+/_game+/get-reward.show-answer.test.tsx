import invariant from "tiny-invariant";
import type { Account } from "~/accounts/models/account";
import { prisma } from "~/db.server";
import {
  LaboratoryRepository,
  ResearchFactory,
  TurnRepository,
} from "~/game/lifecycle/game.server";
import { addAuthenticationSessionTo, setupAccount } from "~/routes/test/utils";
import { action } from "./get-reward.show-answer";

describe("action", () => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "buy-ingredients");
    await prisma.problem.create({
      data: {
        id: "testproblemid",
        title: "testproblemtitle",
        difficulty: 300,
      },
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2022-01-01T00:00:00Z"));
    const newResearch = await ResearchFactory.create(account.id, "testproblemid");
    newResearch.finishedAt = new Date();
    await LaboratoryRepository.addResearch(account.id, newResearch);
    vi.useRealTimers();
  });

  it("should work", async () => {
    const oldLab = await LaboratoryRepository.get(account.id);
    const oldUnrewardedResearch = oldLab.getUnrewardedResearch();
    invariant(oldUnrewardedResearch);
    expect(oldUnrewardedResearch.answerShownAt).toBeNull();
    const request = new Request("http://localhost:3000/", { method: "POST" });
    await addAuthenticationSessionTo(request);
    await action({ request, params: {}, context: {} });
    const lab = await LaboratoryRepository.get(account.id);
    const unrewardedResearch = lab.getUnrewardedResearch();
    invariant(unrewardedResearch);
    expect(unrewardedResearch.answerShownAt).not.toBeNull();
  });
});
