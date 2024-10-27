import type { BaseMetal, Gem, Sword, SwordElement, SwordGrade } from "../models";

export const PROBLEM_DIFFICULTIES = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1800, 2000,
];

export const BASE_METALS = new Map<string, BaseMetal>([
  [
    "baseMetal1",
    {
      id: "baseMetal1",
      name: "Scrap Iron",
      price: 100,
      description:
        "The most common form of iron, reclaimed from discarded metal products. While its quality is low and requires refinement, it's easily obtained.",
    },
  ],
  [
    "baseMetal2",
    {
      id: "baseMetal2",
      name: "Refined Iron",
      price: 200,
      description:
        "Iron obtained by refining scrap iron. It's purer and of higher quality, with increased durability. It's commonly used as a blacksmithing material.",
    },
  ],
  [
    "baseMetal3",
    {
      id: "baseMetal3",
      name: "Steel",
      price: 300,
      description:
        "Reinforced iron alloyed with elements like carbon. It enhances strength and durability, suitable for crafting weapons and armor.",
    },
  ],
  [
    "baseMetal4",
    {
      id: "baseMetal4",
      name: "Magma Iron",
      price: 400,
      description:
        "A special iron ore generated deep underground. It's iron crystallized at high temperatures and essential for crafting very powerful weapons and armor.",
    },
  ],
  [
    "baseMetal5",
    {
      id: "baseMetal5",
      name: "Stellar Iron",
      price: 500,
      description:
        "A legendary iron ore mined from comets or meteorites. It possesses mystical powers necessary for creating the finest weapons and armor. It's extremely rare and difficult to mine, but its power is infinite.",
    },
  ],
]);

export const GEMS = new Map<string, Gem>([
  [
    "gemFire",
    {
      id: "gemFire",
      name: "Ruby",
      price: 100,
      description: "A red gemstone that potentially adds fire attributes to swords.",
    },
  ],
  [
    "gemWater",
    {
      id: "gemWater",
      name: "Sapphire",
      price: 200,
      description: "A blue gemstone that potentially adds water attributes to swords.",
    },
  ],
  [
    "gemLight",
    {
      id: "gemLight",
      name: "Diamond",
      price: 300,
      description: "A clear gemstone that potentially adds light attributes to swords.",
    },
  ],
]);

export const INGREDIENTS = new Map<string, BaseMetal | Gem>([...BASE_METALS, ...GEMS]);

export function calcSwordGrade(baseMetal: BaseMetal) {
  const baseGrade =
    baseMetal.id === "baseMetal1"
      ? 1
      : baseMetal.id === "baseMetal2"
        ? 2
        : baseMetal.id === "baseMetal3"
          ? 3
          : baseMetal.id === "baseMetal4"
            ? 4
            : 5;
  const rand = Math.random();
  const bonusGrade = rand < 0.1 ? 2 : rand < 0.3 ? 1 : 0;
  return { baseGrade, bonusGrade };
}

export function calcSwordElement(gem: Gem) {
  const rand = Math.random();
  if (gem.name === "Ruby") {
    if (rand < 0.8) return "fire";
  } else if (gem.name === "Sapphire") {
    if (rand < 0.4) return "water";
  } else if (gem.name === "Diamond") {
    if (rand < 0.2) return "light";
  }
  return "plain";
}

export const SWORDS: Map<SwordElement, Sword[]> = new Map([
  [
    "plain",
    [
      { name: "Plain Sword 1", price: 100, grade: 1, element: "plain" },
      { name: "Plain Sword 2", price: 200, grade: 2, element: "plain" },
      { name: "Plain Sword 3", price: 400, grade: 3, element: "plain" },
      { name: "Plain Sword 4", price: 800, grade: 4, element: "plain" },
      { name: "Plain Sword 5", price: 1600, grade: 5, element: "plain" },
      { name: "Plain Sword 6", price: 3200, grade: 6, element: "plain" },
      { name: "Plain Sword 7", price: 6400, grade: 7, element: "plain" },
    ],
  ],
  [
    "fire",
    [
      { name: "Fire Sword 1", price: 100 * 1.5, grade: 1, element: "fire" },
      { name: "Fire Sword 2", price: 200 * 1.5, grade: 2, element: "fire" },
      { name: "Fire Sword 3", price: 400 * 1.5, grade: 3, element: "fire" },
      { name: "Fire Sword 4", price: 800 * 1.5, grade: 4, element: "fire" },
      { name: "Fire Sword 5", price: 1600 * 1.5, grade: 5, element: "fire" },
      { name: "Fire Sword 6", price: 3200 * 1.5, grade: 6, element: "fire" },
      { name: "Fire Sword 7", price: 6400 * 1.5, grade: 7, element: "fire" },
    ],
  ],
  [
    "water",
    [
      { name: "Water Sword 1", price: 100 * 3, grade: 1, element: "water" },
      { name: "Water Sword 2", price: 200 * 3, grade: 2, element: "water" },
      { name: "Water Sword 3", price: 400 * 3, grade: 3, element: "water" },
      { name: "Water Sword 4", price: 800 * 3, grade: 4, element: "water" },
      { name: "Water Sword 5", price: 1600 * 3, grade: 5, element: "water" },
      { name: "Water Sword 6", price: 3200 * 3, grade: 6, element: "water" },
      { name: "Water Sword 7", price: 6400 * 3, grade: 7, element: "water" },
    ],
  ],
  [
    "light",
    [
      { name: "Light Sword 1", price: 100 * 5, grade: 1, element: "light" },
      { name: "Light Sword 2", price: 200 * 5, grade: 2, element: "light" },
      { name: "Light Sword 3", price: 400 * 5, grade: 3, element: "light" },
      { name: "Light Sword 4", price: 800 * 5, grade: 4, element: "light" },
      { name: "Light Sword 5", price: 1600 * 5, grade: 5, element: "light" },
      { name: "Light Sword 6", price: 3200 * 5, grade: 6, element: "light" },
      { name: "Light Sword 7", price: 6400 * 5, grade: 7, element: "light" },
    ],
  ],
]);

export function calcRobotExp(difficulty: number) {
  const ave = difficulty / 100;
  const std = 1;
  const mu = Math.log(ave) - std ** 2 / 2;
  const r1 = Math.random();
  const r2 = Math.random();
  const lognormalRand = Math.exp(
    mu + std * Math.sqrt(-2 * Math.log(r1)) * Math.cos(2 * Math.PI * r2),
  );
  return Math.round(lognormalRand * 100);
}

export function calcLvAndResidual(exp: number) {
  const lv = Math.floor(Math.cbrt(exp / 10));
  const residual = exp - lv ** 3 * 10;
  const nextLvExp = (lv + 1) ** 3 * 10;
  return { lv: lv + 1, residual, nextLvExp };
}
