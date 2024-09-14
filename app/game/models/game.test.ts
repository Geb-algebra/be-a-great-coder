import { Laboratory } from "./game.ts";

describe("Laboratory with no research", () => {
  let laboratory: Laboratory;
  beforeEach(() => {
    laboratory = new Laboratory();
  });

  it("should calculate batteryCapacityExp", () => {
    expect(laboratory.batteryCapacityExp).toBe(0);
  });

  it("should calculate performance", () => {
    expect(laboratory.performanceExp).toBe(0);
  });

  it("should calculate researcherRank", () => {
    expect(laboratory.researcherRank).toBe(0);
  });
});

describe("Laboratory", async () => {
  let laboratory: Laboratory;
  test("with no researches", async () => {
    laboratory = new Laboratory();
    expect(laboratory.batteryCapacityExp).toBe(0);
    expect(laboratory.performanceExp).toBe(0);
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
        submittedAt: null,
        solvedAt: null,
        finishedAt: null,
        answerShownAt: null,
        rewardReceivedAt: null,
        batteryCapacityExp: 1,
        performanceExp: 2,
      },
      {
        id: "2",
        problem: { id: "2", title: "problem2", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        submittedAt: null,
        solvedAt: null,
        finishedAt: null,
        answerShownAt: null,
        rewardReceivedAt: null,
        batteryCapacityExp: 1,
        performanceExp: 2,
      },
      {
        id: "3",
        problem: { id: "3", title: "problem3", difficulty: 1000 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        submittedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityExp: 1,
        performanceExp: 2,
      },
    ]);
    expect(laboratory.batteryCapacityExp).toBe(1);
    expect(laboratory.performanceExp).toBe(2);
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
        submittedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityExp: 1,
        performanceExp: 2,
      },
      {
        id: "2",
        problem: { id: "2", title: "problem2", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        submittedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityExp: 1,
        performanceExp: 2,
      },
      {
        id: "3",
        problem: { id: "3", title: "problem3", difficulty: 1000 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        submittedAt: new Date(),
        solvedAt: null,
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityExp: 1,
        performanceExp: 2,
      },
    ]);
    expect(laboratory.batteryCapacityExp).toBe(2); // failed research should be counted
    expect(laboratory.performanceExp).toBe(6);
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
        submittedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityExp: 1,
        performanceExp: 2,
      },
      {
        id: "2",
        problem: { id: "2", title: "problem2", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        submittedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityExp: 1,
        performanceExp: 2,
      },
      {
        id: "3",
        problem: { id: "3", title: "problem3", difficulty: 1000 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        submittedAt: new Date(),
        solvedAt: null,
        finishedAt: null,
        answerShownAt: null,
        rewardReceivedAt: null,
        batteryCapacityExp: 10,
        performanceExp: 20,
      },
    ]);
    expect(laboratory.batteryCapacityExp).toBe(2);
    expect(laboratory.performanceExp).toBe(4);
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
        submittedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityExp: 10,
        performanceExp: 20,
      },
      {
        id: "2",
        problem: { id: "2", title: "problem2", difficulty: 100 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        submittedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: new Date(),
        rewardReceivedAt: new Date(),
        batteryCapacityExp: 10,
        performanceExp: 20,
      },
      {
        id: "3",
        problem: { id: "3", title: "problem3", difficulty: 1000 },
        userId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        submittedAt: new Date(),
        solvedAt: new Date(),
        finishedAt: new Date(),
        answerShownAt: null,
        rewardReceivedAt: new Date(),
        batteryCapacityExp: 10,
        performanceExp: 20,
      },
    ]);
    expect(laboratory.batteryCapacityExp).toBe(30);
    expect(laboratory.performanceExp).toBe(40); // problem whose answer did not shown should not be counted
    expect(laboratory.researcherRank).toBe(400);
  });
});
