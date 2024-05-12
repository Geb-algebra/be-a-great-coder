import invariant from "tiny-invariant";
import { prisma } from "~/db.server.ts";
import { ObjectNotFoundError } from "~/errors.ts";
import { TotalAssets } from "../models/game.ts";
import { INGREDIENTS } from "../services/config.ts";
import {
  LaboratoryRepository,
  ResearchFactory,
  TotalAssetsFactory,
  TotalAssetsRepository,
} from "./game.server.ts";

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
    const totalAssets = new TotalAssets(
      1000,
      1,
      new Map([...INGREDIENTS.keys()].map((id, index) => [id, index])),
    );
    await TotalAssetsRepository.save(userId, totalAssets);
    const savedTotalAssets = await TotalAssetsRepository.getOrThrow(userId);

    expect(savedTotalAssets).toEqual(totalAssets);
  });

  it("should save and get empty total assets", async () => {
    const totalAssets = TotalAssetsFactory.initialize();
    await TotalAssetsRepository.save(userId, totalAssets);
    const savedTotalAssets = await TotalAssetsRepository.getOrThrow(userId);

    expect(savedTotalAssets).toEqual(totalAssets);
  });

  it("should throw ObjectNotFoundError when total assets not found", async () => {
    await expect(TotalAssetsRepository.getOrThrow(userId)).rejects.toThrow(ObjectNotFoundError);
  });

  it("should update total assets", async () => {
    const totalAssets = new TotalAssets(
      1000,
      1,
      new Map([...INGREDIENTS.keys()].map((id) => [id, 0])),
    );
    await TotalAssetsRepository.save(userId, totalAssets);
    const updatedTotalAssets = new TotalAssets(
      2000,
      2,
      new Map([...INGREDIENTS.keys()].map((id, index) => [id, index])),
    );
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

    const laboratory = await LaboratoryRepository.get(userId);
    laboratory.researches.push(research);
    await LaboratoryRepository.save(userId, laboratory);
    const savedLaboratory = await LaboratoryRepository.get(userId);
    expect({ ...savedLaboratory.researches[0], updatedAt: undefined }).toMatchObject({
      ...research,
      updatedAt: undefined,
    });
  });

  it.each([0, 2])(
    "should insert new unrewarded research when %d rewarded researches exist",
    async (numResearch) => {
      {
        const laboratory = await LaboratoryRepository.get(userId);
        for (let index = 0; index < numResearch; index++) {
          await prisma.problem.create({
            data: { id: `problem-id-${index}`, title: `problem-title-${index}`, difficulty: 100 },
          });
        }
        laboratory.researches = await Promise.all(
          Array.from({ length: numResearch }, async (_, index) => {
            const problem = await prisma.problem.findFirst({
              where: { id: `problem-id-${index}` },
            });
            invariant(problem);
            const research = await ResearchFactory.create(userId, problem.id);
            research.rewardReceivedAt = new Date();
            return research;
          }),
        );
        await LaboratoryRepository.forceSaveAllForTesting(userId, laboratory);
      }

      const problem = await prisma.problem.create({
        data: { id: "problem-id", title: "problem-title", difficulty: 100 },
      });
      const research = await ResearchFactory.create(userId, problem.id);

      const laboratory = await LaboratoryRepository.get(userId);
      laboratory.researches.push(research);
      await LaboratoryRepository.save(userId, laboratory);

      const savedLaboratory = await LaboratoryRepository.get(userId);
      expect({
        ...savedLaboratory.researches.find((r) => r.id === research.id),
        updatedAt: undefined,
      }).toMatchObject({
        ...research,
        updatedAt: undefined,
      });
    },
  );

  it.each([0, 2])(
    "should ignore if trying to insert new rewarded research when %d rewarded researches exist",
    async (numResearch) => {
      {
        const laboratory = await LaboratoryRepository.get(userId);
        for (let index = 0; index < numResearch; index++) {
          await prisma.problem.create({
            data: { id: `problem-id-${index}`, title: `problem-title-${index}`, difficulty: 100 },
          });
        }
        laboratory.researches = await Promise.all(
          Array.from({ length: numResearch }, async (_, index) => {
            const problem = await prisma.problem.findFirst({
              where: { id: `problem-id-${index}` },
            });
            invariant(problem);
            const research = await ResearchFactory.create(userId, problem.id);
            research.rewardReceivedAt = new Date();
            return research;
          }),
        );
        await LaboratoryRepository.forceSaveAllForTesting(userId, laboratory);
      }
      const problem = await prisma.problem.create({
        data: { id: "problem-id", title: "problem-title", difficulty: 100 },
      });
      const research = await ResearchFactory.create(userId, problem.id);
      research.rewardReceivedAt = new Date();

      const laboratory = await LaboratoryRepository.get(userId);
      laboratory.researches.push(research);
      await LaboratoryRepository.save(userId, laboratory);
      const savedLaboratory = await LaboratoryRepository.get(userId);
      expect(savedLaboratory.researches).toHaveLength(numResearch);
    },
  );

  it.each([0, 2])(
    "should update unrewarded researches when %d rewarded researches exist",
    async (numResearch) => {
      {
        const laboratory = await LaboratoryRepository.get(userId);
        for (let index = 0; index < numResearch; index++) {
          await prisma.problem.create({
            data: { id: `problem-id-${index}`, title: `problem-title-${index}`, difficulty: 100 },
          });
        }
        laboratory.researches = await Promise.all(
          Array.from({ length: numResearch }, async (_, index) => {
            const problem = await prisma.problem.findFirst({
              where: { id: `problem-id-${index}` },
            });
            invariant(problem);
            const research = await ResearchFactory.create(userId, problem.id);
            research.rewardReceivedAt = new Date();
            return research;
          }),
        );
        await LaboratoryRepository.forceSaveAllForTesting(userId, laboratory);
      }
      const problem = await prisma.problem.create({
        data: { id: "problem-id", title: "problem-title", difficulty: 100 },
      });
      const research = await ResearchFactory.create(userId, problem.id);

      const laboratory = await LaboratoryRepository.get(userId);
      laboratory.researches.push(research);
      await LaboratoryRepository.save(userId, laboratory);

      const savedLaboratory = await LaboratoryRepository.get(userId);
      const savedResearch = savedLaboratory.researches.find((r) => r.id === research.id);
      invariant(savedResearch);
      savedResearch.startedAt = new Date(Date.now() + 1000 * 60 * 60 * 12);
      savedResearch.solvedAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
      savedResearch.finishedAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2);
      savedResearch.answerShownAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
      savedResearch.rewardReceivedAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 4);
      await LaboratoryRepository.save(userId, savedLaboratory);

      const updatedLaboratory = await LaboratoryRepository.get(userId);
      expect({
        ...updatedLaboratory.researches.find((r) => r.id === research.id),
        updatedAt: undefined,
      }).toMatchObject({
        ...savedResearch,
        updatedAt: undefined,
      });
    },
  );

  it.each([0, 2])(
    "should delete unstarted researches when %d rewarded researches exist",
    async (numResearch) => {
      {
        const laboratory = await LaboratoryRepository.get(userId);
        for (let index = 0; index < numResearch; index++) {
          await prisma.problem.create({
            data: { id: `problem-id-${index}`, title: `problem-title-${index}`, difficulty: 100 },
          });
        }
        laboratory.researches = await Promise.all(
          Array.from({ length: numResearch }, async (_, index) => {
            const problem = await prisma.problem.findFirst({
              where: { id: `problem-id-${index}` },
            });
            invariant(problem);
            const research = await ResearchFactory.create(userId, problem.id);
            research.rewardReceivedAt = new Date();
            return research;
          }),
        );
        await LaboratoryRepository.forceSaveAllForTesting(userId, laboratory);
      }
      const problem = await prisma.problem.create({
        data: { id: "problem-id", title: "problem-title", difficulty: 100 },
      });
      const research = await ResearchFactory.create(userId, problem.id);

      const laboratory = await LaboratoryRepository.get(userId);
      const originalResearches = Array.from(laboratory.researches);
      laboratory.researches.push(research);
      await LaboratoryRepository.save(userId, laboratory);

      const savedLaboratory = await LaboratoryRepository.get(userId);
      savedLaboratory.researches = originalResearches;
      await LaboratoryRepository.save(userId, savedLaboratory);

      const updatedLaboratory = await LaboratoryRepository.get(userId);
      expect(
        updatedLaboratory.researches.map((r) => ({
          ...r,
          updatedAt: undefined,
        })),
      ).toEqual(
        originalResearches.map((r) => ({
          ...r,
          updatedAt: undefined,
        })),
      );
    },
  );
});
