import type { Ingredient, Product } from "../models/game";

export const PROBLEM_DIFFICULTIES = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1800, 2000,
];

export const INGREDIENTS: Ingredient[] = [
  { name: "Iron", price: 100 },
  { name: "Copper", price: 200 },
  { name: "Silver", price: 300 },
  { name: "Gold", price: 400 },
  { name: "Platinum", price: 500 },
  { name: "Diamond", price: 600 },
];

/**
 * Returns a function that calculates the price of a product.
 *
 * @param ave The average price of the product.
 * @param var The variance of the price of the product.
 */
export function calcPrice(ave: number, std: number) {
  const mu = Math.log(ave) - std ** 2 / 2;
  const r1 = Math.random();
  const r2 = Math.random();
  const lognormalRand = Math.exp(
    mu + std * Math.sqrt(-2 * Math.log(r1)) * Math.cos(2 * Math.PI * r2),
  );
  return Math.round(lognormalRand);
}

export const PRODUCTS: Product[] = [
  { name: "Sword", priceAverage: 300, priceStd: 1, ingredients: new Map([["Iron", 3]]) },
  {
    name: "Shield",
    priceAverage: 500,
    priceStd: 1,
    ingredients: new Map([
      ["Iron", 2],
      ["Copper", 1],
    ]),
  },
  {
    name: "Ring",
    priceAverage: 1000,
    priceStd: 10,
    ingredients: new Map([
      ["Gold", 1],
      ["Platinum", 1],
    ]),
  },
  {
    name: "Necklace",
    priceAverage: 2000,
    priceStd: 10,
    ingredients: new Map([
      ["Gold", 2],
      ["Diamond", 1],
    ]),
  },
];

export function calcRobotGrowthRate(difficulty: number) {
  const ave = difficulty / 100;
  const std = 1;
  const mu = Math.log(ave) - std ** 2 / 2;
  const r1 = Math.random();
  const r2 = Math.random();
  const lognormalRand = Math.exp(
    mu + std * Math.sqrt(-2 * Math.log(r1)) * Math.cos(2 * Math.PI * r2),
  );
  return Math.round(lognormalRand);
}
