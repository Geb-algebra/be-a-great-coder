import { prisma } from "~/db.server.ts";
import { TotalAssets } from "../models/game.ts";
import { TotalAssetsRepository, LaboratoryRepository, ResearchFactory } from "./game.server.ts";
import { ObjectNotFoundError } from "~/errors.ts";

beforeEach(async () => {
  await prisma.user.create({
    data: {
      id: "test-user-id",
      name: "test-user-name",
    },
  });
});

describe("TotalAssetsRepository", () => {
  const userId = "test-user-id";

  it("should save and get total assets", async () => {
    const totalAssets = new TotalAssets(1000, 1, new Map([["iron", 0]]));
    await TotalAssetsRepository.save(userId, totalAssets);
    const savedTotalAssets = await TotalAssetsRepository.getOrThrow(userId);

    expect(savedTotalAssets).toEqual(totalAssets);
  });

  it("should throw ObjectNotFoundError when total assets not found", async () => {
    await expect(TotalAssetsRepository.getOrThrow(userId)).rejects.toThrow(ObjectNotFoundError);
  });

  it("should update total assets", async () => {
    const totalAssets = new TotalAssets(1000, 1, new Map([["iron", 0]]));
    await TotalAssetsRepository.save(userId, totalAssets);
    const updatedTotalAssets = new TotalAssets(2000, 2, new Map([["iron", 1]]));
    await TotalAssetsRepository.save(userId, updatedTotalAssets);
    const savedTotalAssets = await TotalAssetsRepository.getOrThrow(userId);
    expect(savedTotalAssets).toEqual(updatedTotalAssets);
  });
});

describe("LaboratoryRepository", async () => {
  const userId = "test-user-id";

  it("should save and get laboratory", async () => {
    const problem = await prisma.problem.create({
      data: { id: "problem-id", title: "problem-title", difficulty: 100 },
    });
    const research = await ResearchFactory.create(userId, problem.id);
    await LaboratoryRepository.addResearch(userId, research);
    const savedLaboratory = await LaboratoryRepository.get(userId);
    expect({ ...savedLaboratory.researches[0], updatedAt: undefined }).toMatchObject({
      ...research,
      updatedAt: undefined,
    });
  });

  it("should update laboratory", async () => {
    await (async () => {
      const problem = await prisma.problem.create({
        data: { id: "problem-id", title: "problem-title", difficulty: 100 },
      });
      const research = await ResearchFactory.create(userId, problem.id);
      await LaboratoryRepository.addResearch(userId, research);
    })();

    const laboratory = await LaboratoryRepository.get(userId);
    const research = laboratory.researches[0];
    research.solvedAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    research.finishedAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2);
    research.answerShownAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
    research.rewardReceivedAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 4);
    research.batteryCapacityIncrement = 1;
    research.performanceIncrement = 2;
    await LaboratoryRepository.updateUnrewardedResearch(userId, laboratory);

    const savedLaboratory = await LaboratoryRepository.get(userId);
    expect({ ...savedLaboratory.researches[0], updatedAt: undefined }).toMatchObject({
      ...research,
      updatedAt: undefined,
    });
  });

  it("should update latest research", async () => {
    await (async () => {
      const problem1 = await prisma.problem.create({
        data: { id: "problem-id-1", title: "problem-title-1", difficulty: 100 },
      });
      const research1 = await ResearchFactory.create(userId, problem1.id);
      research1.solvedAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
      research1.finishedAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2);
      research1.answerShownAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
      research1.rewardReceivedAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 4);
      research1.batteryCapacityIncrement = 1;
      research1.performanceIncrement = 2;
      await LaboratoryRepository.addResearch(userId, research1);

      const problem2 = await prisma.problem.create({
        data: { id: "problem-id-2", title: "problem-title-2", difficulty: 200 },
      });
      const research2 = await ResearchFactory.create(userId, problem2.id);
      await LaboratoryRepository.addResearch(userId, research2);
    })();

    const laboratory = await LaboratoryRepository.get(userId);
    const research = laboratory.getLatestResearch();
    research.solvedAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    research.finishedAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2);
    research.answerShownAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
    research.rewardReceivedAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 4);
    research.batteryCapacityIncrement = 1;
    research.performanceIncrement = 2;
    await LaboratoryRepository.updateUnrewardedResearch(userId, laboratory);

    const savedLaboratory = await LaboratoryRepository.get(userId);
    expect({ ...savedLaboratory.getLatestResearch(), updatedAt: undefined }).toMatchObject({
      ...research,
      updatedAt: undefined,
    });
  });
});
