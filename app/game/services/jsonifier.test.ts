import { type IngredientName, Laboratory, TotalAssets } from "../models/game";
import { LaboratoryJsonifier, TotalAssetsJsonifier } from "./jsonifier";

describe("TotalAssetsJsonifier", () => {
  const initialTotalAssets = new TotalAssets(
    1000,
    10,
    new Map([
      ["Iron", 5],
      ["Copper", 3],
      ["Silver", 0],
      ["Gold", 0],
      ["Platinum", 0],
      ["Diamond", 1],
    ] as [IngredientName, number][]),
  );

  it("should convert to json", () => {
    const json = TotalAssetsJsonifier.toJson(initialTotalAssets);
    expect(json.cash).toBe(1000);
    expect(json.battery).toBe(10);
    expect(json.ingredientStock).toEqual([
      ["Iron", 5],
      ["Copper", 3],
      ["Silver", 0],
      ["Gold", 0],
      ["Platinum", 0],
      ["Diamond", 1],
    ]);
  });

  it("should convert from json", () => {
    const json = {
      cash: 1000,
      battery: 10,
      ingredientStock: [
        ["Iron", 5],
        ["Copper", 3],
        ["Silver", 0],
        ["Gold", 0],
        ["Platinum", 0],
        ["Diamond", 1],
      ] as [IngredientName, number][],
    };
    const totalAssets = TotalAssetsJsonifier.fromJson(json);
    expect(totalAssets).toEqual(initialTotalAssets);
  });
});

describe("LaboratoryJsonifier", () => {
  const initialLaboratory = new Laboratory([
    {
      id: "1",
      problem: {
        id: "1",
        title: "A",
        difficulty: 1,
      },
      userId: "1",
      createdAt: new Date("2021-01-01"),
      updatedAt: new Date("2021-01-01"),
      startedAt: new Date("2021-01-01"),
      solvedAt: new Date("2021-01-01"),
      finishedAt: new Date("2021-01-01"),
      answerShownAt: new Date("2021-01-01"),
      rewardReceivedAt: new Date("2021-01-01"),
      batteryCapacityIncrement: 1,
      performanceIncrement: 1,
    },
  ]);

  it("should convert to json", () => {
    const json = LaboratoryJsonifier.toJson(initialLaboratory);
    expect(json).toEqual({
      researches: [
        {
          id: "1",
          problem: {
            id: "1",
            title: "A",
            difficulty: 1,
          },
          userId: "1",
          createdAt: "2021-01-01T00:00:00.000Z",
          updatedAt: "2021-01-01T00:00:00.000Z",
          startedAt: "2021-01-01T00:00:00.000Z",
          solvedAt: "2021-01-01T00:00:00.000Z",
          finishedAt: "2021-01-01T00:00:00.000Z",
          answerShownAt: "2021-01-01T00:00:00.000Z",
          rewardReceivedAt: "2021-01-01T00:00:00.000Z",
          batteryCapacityIncrement: 1,
          performanceIncrement: 1,
        },
      ],
    });
  });

  it("should convert from json", () => {
    const json = {
      researches: [
        {
          id: "1",
          problem: {
            id: "1",
            title: "A",
            difficulty: 1,
          },
          userId: "1",
          createdAt: "2021-01-01T00:00:00.000Z",
          updatedAt: "2021-01-01T00:00:00.000Z",
          startedAt: "2021-01-01T00:00:00.000Z",
          solvedAt: "2021-01-01T00:00:00.000Z",
          finishedAt: "2021-01-01T00:00:00.000Z",
          answerShownAt: "2021-01-01T00:00:00.000Z",
          rewardReceivedAt: "2021-01-01T00:00:00.000Z",
          batteryCapacityIncrement: 1,
          performanceIncrement: 1,
        },
      ],
    };
    const laboratory = LaboratoryJsonifier.fromJson(json);
    expect(laboratory).toEqual(initialLaboratory);
  });
});
