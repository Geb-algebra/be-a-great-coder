import { GameLogicViolated } from "~/errors.ts";
import { TotalAssets } from "../models/game.ts";
import { TotalAssetsUpdateService, getDifficultiesMatchUserRank } from "./game.server.ts";

describe("TotalAssetsUpdateService", () => {
  const initialTotalAssets = new TotalAssets(1000, 10, new Map([["iron", 5]]));

  it("should buy ingredients", () => {
    const newTotalAssets = TotalAssetsUpdateService.buyIngredients(initialTotalAssets, "iron", 5);
    expect(newTotalAssets.cash).toEqual(1000 - 100 * 5);
    expect(newTotalAssets.ingredientStock.get("iron")).toEqual(5 + 5);
    expect(newTotalAssets.battery).toEqual(10);
  });

  it("should not buy ingredients if not enough money", () => {
    expect(() => {
      TotalAssetsUpdateService.buyIngredients(initialTotalAssets, "iron", 11);
    }).toThrow(GameLogicViolated);
  });

  it("should manufacture products", () => {
    const { newTotalAssets, quantity } = TotalAssetsUpdateService.manufactureProducts(
      initialTotalAssets,
      "sword",
      1,
    );
    expect(newTotalAssets.cash).toEqual(1000);
    expect(newTotalAssets.ingredientStock.get("iron")).toEqual(5 - 3);
    expect(quantity).toEqual(1);
    expect(newTotalAssets.battery).toEqual(10 - 1);
  });

  it("should not manufacture products if not enough ingredients", () => {
    expect(() => {
      TotalAssetsUpdateService.manufactureProducts(initialTotalAssets, "sword", 2);
    }).toThrow(GameLogicViolated);
  });

  it("should sell products", () => {
    const newTotalAssets = TotalAssetsUpdateService.sellProducts(
      initialTotalAssets,
      new Map([["sword", 1]]),
    );
    expect(newTotalAssets.cash).toEqual(1000 + 400);
    expect(newTotalAssets.ingredientStock.get("iron")).toEqual(5);
    expect(newTotalAssets.battery).toEqual(10);
  });

  it("should charge battery", () => {
    const newTotalAssets = TotalAssetsUpdateService.chargeBattery(initialTotalAssets, 20);
    expect(newTotalAssets.cash).toEqual(1000);
    expect(newTotalAssets.ingredientStock.get("iron")).toEqual(5);
    expect(newTotalAssets.battery).toEqual(20);
  });
});

describe("getThreeDifficultiesMatchUserRank", () => {
  it("should return first three difficulties if the user rank is <= 200", () => {
    expect(getDifficultiesMatchUserRank(50)).toEqual([100, 200, 300]);
    expect(getDifficultiesMatchUserRank(200)).toEqual([100, 200, 300]);
  });

  it("should return one difficulty that match user, one easy and one hard for user", () => {
    expect(getDifficultiesMatchUserRank(201)).toEqual([200, 300, 400]);
    expect(getDifficultiesMatchUserRank(299)).toEqual([200, 300, 400]);
    expect(getDifficultiesMatchUserRank(512)).toEqual([500, 600, 700]);
    expect(getDifficultiesMatchUserRank(1600)).toEqual([1500, 1600, 1800]);
  });

  it("should return last three difficulties if the user rank is >= 1600", () => {
    expect(getDifficultiesMatchUserRank(1601)).toEqual([1600, 1800, 2000]);
    expect(getDifficultiesMatchUserRank(1801)).toEqual([1600, 1800, 2000]);
    expect(getDifficultiesMatchUserRank(2000)).toEqual([1600, 1800, 2000]);
  });
});
