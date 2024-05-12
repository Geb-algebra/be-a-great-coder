import { GameLogicViolated } from "~/errors.ts";
import { TotalAssets } from "../models/game.ts";
import { BASE_METALS, GEMS, INGREDIENTS } from "../services/config.ts";
import { TotalAssetsUpdateService, getDifficultiesMatchUserRank } from "./game.server.ts";

const allPairsOfBaseMetalsAndGems = Array.from(BASE_METALS.values()).flatMap((baseMetal) =>
  Array.from(GEMS.values()).map((gem) => [baseMetal, gem] as [typeof baseMetal, typeof gem]),
);

describe("TotalAssetsUpdateService", () => {
  const initialTotalAssets = new TotalAssets(
    100000,
    10,
    new Map([...INGREDIENTS.keys()].map((i) => [i, 10])),
  );

  it.each([...INGREDIENTS.values()])("should buy ingredients", (ingredient) => {
    const newTotalAssets = TotalAssetsUpdateService.buyIngredients(
      initialTotalAssets,
      ingredient.id,
      5,
    );
    expect(newTotalAssets.cash).toEqual(100000 - ingredient.price * 5);
    expect(newTotalAssets.ingredientStock.get(ingredient.id)).toEqual(10 + 5);
    expect(newTotalAssets.battery).toEqual(10);
  });

  it.each([...INGREDIENTS.values()])(
    "should not buy ingredients if not enough money",
    (ingredient) => {
      const ta = new TotalAssets(1000, 10, new Map([...INGREDIENTS.keys()].map((i) => [i, 5])));
      expect(() => {
        TotalAssetsUpdateService.buyIngredients(ta, ingredient.id, 11);
      }).toThrow(GameLogicViolated);
    },
  );

  it.each(allPairsOfBaseMetalsAndGems)("should make and sell products", (baseMetal, gem) => {
    const { newTotalAssets, grade, element, sword } = TotalAssetsUpdateService.forgeAndSellSword(
      initialTotalAssets,
      baseMetal,
      gem,
    );
    expect(newTotalAssets.cash).toEqual(100000 + sword.price);
    expect(newTotalAssets.ingredientStock.get(baseMetal.id)).toEqual(10 - 1);
    expect(newTotalAssets.ingredientStock.get(gem.id)).toEqual(10 - 1);
    expect(newTotalAssets.battery).toEqual(10 - 1);
  });

  it.each(allPairsOfBaseMetalsAndGems)(
    "should not manufacture products if not enough ingredients",
    (baseMetal, gem) => {
      const emptyTotalAssets = new TotalAssets(
        100000,
        10,
        new Map([...INGREDIENTS.keys()].map((i) => [i, 0])),
      );
      expect(() => {
        TotalAssetsUpdateService.forgeAndSellSword(emptyTotalAssets, baseMetal, gem);
      }).toThrow(GameLogicViolated);
    },
  );

  it("should charge battery", () => {
    const newTotalAssets = TotalAssetsUpdateService.chargeBattery(initialTotalAssets, 20);
    expect(newTotalAssets.cash).toEqual(100000);
    for (const ingredientId of INGREDIENTS.keys()) {
      expect(newTotalAssets.ingredientStock.get(ingredientId)).toEqual(10);
    }
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
