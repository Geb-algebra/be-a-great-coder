import { GameLogicViolated } from "~/errors.ts";
import { TotalAssets } from "../models/game.ts";
import { INGREDIENTS, PRODUCTS } from "../services/config.ts";
import * as Config from "../services/config.ts";
import { TotalAssetsUpdateService, getDifficultiesMatchUserRank } from "./game.server.ts";

describe("TotalAssetsUpdateService", () => {
  const initialTotalAssets = new TotalAssets(
    100000,
    10,
    new Map(INGREDIENTS.map((i) => [i.name, 10])),
  );

  it.each(INGREDIENTS)("should buy ingredients", (ingredient) => {
    const newTotalAssets = TotalAssetsUpdateService.buyIngredients(
      initialTotalAssets,
      ingredient.name,
      5,
    );
    expect(newTotalAssets.cash).toEqual(100000 - ingredient.price * 5);
    expect(newTotalAssets.ingredientStock.get(ingredient.name)).toEqual(10 + 5);
    expect(newTotalAssets.battery).toEqual(10);
  });

  it.each(INGREDIENTS)("should not buy ingredients if not enough money", (ingredient) => {
    const ta = new TotalAssets(1000, 10, new Map(INGREDIENTS.map((i) => [i.name, 5])));
    expect(() => {
      TotalAssetsUpdateService.buyIngredients(ta, ingredient.name, 11);
    }).toThrow(GameLogicViolated);
  });

  it.each(PRODUCTS)("should make and sell products", (product) => {
    const { newTotalAssets, price } = TotalAssetsUpdateService.makeAndSellProduct(
      initialTotalAssets,
      product,
    );
    expect(newTotalAssets.cash).toEqual(100000 + price);
    for (const [ingredientName, amount] of product.ingredients) {
      expect(newTotalAssets.ingredientStock.get(ingredientName)).toEqual(10 - amount);
    }
    expect(newTotalAssets.battery).toEqual(10 - 1);
  });

  it.each(PRODUCTS)("should not manufacture products if not enough ingredients", (product) => {
    const emptyTotalAssets = new TotalAssets(
      100000,
      10,
      new Map(INGREDIENTS.map((i) => [i.name, 0])),
    );
    expect(() => {
      TotalAssetsUpdateService.makeAndSellProduct(emptyTotalAssets, product);
    }).toThrow(GameLogicViolated);
  });

  it("should charge battery", () => {
    const newTotalAssets = TotalAssetsUpdateService.chargeBattery(initialTotalAssets, 20);
    expect(newTotalAssets.cash).toEqual(100000);
    for (const ingredientName of INGREDIENTS.map((i) => i.name)) {
      expect(newTotalAssets.ingredientStock.get(ingredientName)).toEqual(10);
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
