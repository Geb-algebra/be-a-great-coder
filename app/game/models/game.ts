export const TURNS = [
  "buy-ingredients",
  "sell-products",
  "select-problems",
  "solve-problems",
  "get-reward",
] as const;
export type Turn = (typeof TURNS)[number];

export const INGREDIENT_NAMES = [
  "Iron",
  "Copper",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
] as const;
export type IngredientName = (typeof INGREDIENT_NAMES)[number];

export function isIngredientName(name: string): name is IngredientName {
  return INGREDIENT_NAMES.includes(name as IngredientName);
}

export type Ingredient = {
  name: IngredientName;
  price: number;
};

export const INGREDIENTS: Ingredient[] = [
  { name: "Iron", price: 100 },
  { name: "Copper", price: 200 },
  { name: "Silver", price: 300 },
  { name: "Gold", price: 400 },
  { name: "Platinum", price: 500 },
  { name: "Diamond", price: 600 },
];

export type Product = {
  name: string;
  price: number;
  ingredients: Map<string, number>;
};

export const PRODUCTS: Product[] = [
  { name: "Sword", price: 1000, ingredients: new Map([["Iron", 3]]) },
  {
    name: "Shield",
    price: 2000,
    ingredients: new Map([
      ["Iron", 2],
      ["Copper", 1],
    ]),
  },
  {
    name: "Ring",
    price: 3000,
    ingredients: new Map([
      ["Gold", 1],
      ["Platinum", 1],
    ]),
  },
  {
    name: "Necklace",
    price: 4000,
    ingredients: new Map([
      ["Gold", 2],
      ["Diamond", 1],
    ]),
  },
];

export class TotalAssets {
  readonly cash: number;
  readonly battery: number;
  private _ingredientStock: Map<IngredientName, number>;

  constructor(money: number, battery: number, ingredientStock: Map<IngredientName, number>) {
    this.cash = money;
    this.battery = battery;
    this._ingredientStock = ingredientStock;
  }

  get ingredientStock() {
    return new Map(this._ingredientStock);
  }
}

export type Problem = {
  id: string;
  title: string;
  difficulty: number;
};

export type Research = {
  id: string;
  problem: Problem;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  solvedAt: Date | null;
  finishedAt: Date | null;
  answerShownAt: Date | null;
  rewardReceivedAt: Date | null;
  batteryCapacityIncrement: number | null;
  performanceIncrement: number | null;
};

export type LaboratoryValue = {
  batteryCapacity: number;
  performance: number;
  researcherRank: number;
};

export class Laboratory {
  public researches: Research[];

  constructor(researches: Research[] = []) {
    this.researches = researches;
  }

  private get rewardedResearches() {
    return this.researches.filter((research) => research.rewardReceivedAt !== null);
  }

  get batteryCapacity() {
    return this.rewardedResearches.reduce(
      (acc, research) => acc + (research.batteryCapacityIncrement ?? 0),
      1,
    );
  }

  get performance() {
    return this.rewardedResearches.reduce(
      (acc, research) => acc + (research.performanceIncrement ?? 0),
      1,
    );
  }

  get researcherRank() {
    return this.researches
      .filter((research) => research.solvedAt !== null)
      .slice(-5)
      .reduce(
        (ave, research, index) => (ave * index + research.problem.difficulty) / (index + 1),
        0,
      );
  }

  get laboratoryValue(): LaboratoryValue {
    return {
      batteryCapacity: this.batteryCapacity,
      performance: this.performance,
      researcherRank: this.researcherRank,
    };
  }

  getUnfinishedResearch() {
    return this.researches.find((research) => research.finishedAt === null);
  }

  getUnrewardedResearch() {
    return this.researches.find(
      (research) => research.finishedAt !== null && research.rewardReceivedAt === null,
    );
  }

  getLatestResearch() {
    return this.researches.reduce((latest, research) => {
      if (latest === null) {
        return research;
      }
      return research.createdAt > latest.createdAt ? research : latest;
    });
  }
}
