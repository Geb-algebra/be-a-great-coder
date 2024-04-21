import { n } from "vitest/dist/reporters-P7C2ytIv.js";
import { Laboratory } from "./game.ts";

describe("Laboratory with no research", () => {
  let laboratory: Laboratory;
  beforeEach(() => {
    laboratory = new Laboratory();
  });

  it("should calculate batteryCapacity", () => {
    expect(laboratory.batteryCapacity).toBe(1);
  });

  it("should calculate performance", () => {
    expect(laboratory.performance).toBe(1);
  });

  it("should calculate researcherRank", () => {
    expect(laboratory.researcherRank).toBe(0);
  });
});

describe("Laboratory", async () => {
  let laboratory: Laboratory;
  test("with no researches", async () => {
    laboratory = new Laboratory();
    expect(laboratory.batteryCapacity).toBe(1);
    expect(laboratory.performance).toBe(1);
    expect(laboratory.researcherRank).toBe(0);
  });

  test("with candidate researches", async () => {
    laboratory = new Laboratory([
      {
        id: "1",
        problem: { id: "1", title: "problem1", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        solvedAt: null,
        finishedAt: null,
        answerShownAt: null,
        rewardReceivedAt: null,
        batteryCapacityIncrement: 1,
        performanceIncrement: 2,
      },
      {
        id: "2",
        problem: { id: "2", title: "problem2", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        solvedAt: null,
        finishedAt: null,
        answerShownAt: null,
        rewardReceivedAt: null,
        batteryCapacityIncrement: 1,
        performanceIncrement: 2,
      },
      {
        id: "3",
        problem: { id: "3", title: "problem3", difficulty: 1000 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 2,
      },
    ]);
    expect(laboratory.batteryCapacity).toBe(2);
    expect(laboratory.performance).toBe(3);
    expect(laboratory.researcherRank).toBe(1000);
  });

  test("with failed research", async () => {
    laboratory = new Laboratory([
      {
        id: "1",
        problem: { id: "1", title: "problem1", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 2,
      },
      {
        id: "2",
        problem: { id: "2", title: "problem2", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 2,
      },
      {
        id: "3",
        problem: { id: "3", title: "problem3", difficulty: 1000 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        solvedAt: null,
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 2,
      },
    ]);
    expect(laboratory.batteryCapacity).toBe(3); // failed research should be counted
    expect(laboratory.performance).toBe(7);
    expect(laboratory.researcherRank).toBe(100); // unsolved problem should not be counted
  });

  test("with unsolved research", async () => {
    laboratory = new Laboratory([
      {
        id: "1",
        problem: { id: "1", title: "problem1", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 2,
      },
      {
        id: "2",
        problem: { id: "2", title: "problem2", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 2,
      },
      {
        id: "3",
        problem: { id: "3", title: "problem3", difficulty: 1000 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        solvedAt: null,
        finishedAt: null,
        answerShownAt: null,
        rewardReceivedAt: null,
        batteryCapacityIncrement: 10,
        performanceIncrement: 20,
      },
    ]);
    expect(laboratory.batteryCapacity).toBe(3);
    expect(laboratory.performance).toBe(5);
    expect(laboratory.researcherRank).toBe(100); // unsolved problem should not be counted
  });

  test("with research whose answer has not shown", async () => {
    laboratory = new Laboratory([
      {
        id: "1",
        problem: { id: "1", title: "problem1", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 2,
      },
      {
        id: "2",
        problem: { id: "2", title: "problem2", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 1,
        performanceIncrement: 2,
      },
      {
        id: "3",
        problem: { id: "3", title: "problem3", difficulty: 1000 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: null,
        rewardReceivedAt: new Date(),
        batteryCapacityIncrement: 10,
        performanceIncrement: 20,
      },
    ]);
    expect(laboratory.batteryCapacity).toBe(13);
    expect(laboratory.performance).toBe(5); // problem whose answer did not shown should not be counted
    expect(laboratory.researcherRank).toBe(400);
  });
});
