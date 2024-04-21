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

export const PRODUCT_NAMES = ["Sword", "Shield", "Ring", "Necklace"] as const;
export type ProductName = (typeof PRODUCT_NAMES)[number];
export function isProductName(name: string): name is ProductName {
  return PRODUCT_NAMES.includes(name as ProductName);
}

export type Product = {
  name: string;
  priceAverage: number;
  priceStd: number;
  ingredients: Map<IngredientName, number>;
};

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
  startedAt: Date | null;
  submittedAt: Date | null;
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
    this.researches = researches.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  private get rewardedResearches() {
    return this.researches.filter((research) => research.rewardReceivedAt !== null);
  }

  get batteryCapacity() {
    return this.rewardedResearches
      .filter((research) => research.solvedAt !== null)
      .reduce((acc, research) => acc + (research.batteryCapacityIncrement ?? 0), 1);
  }

  get performance() {
    return this.rewardedResearches
      .filter((research) => research.answerShownAt !== null && research.submittedAt !== null)
      .reduce((acc, research) => acc + (research.performanceIncrement ?? 0), 1);
  }

  get researcherRank() {
    return this.rewardedResearches
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

  getCandidateResearches() {
    return this.researches.filter((research) => research.startedAt === null);
  }

  getUnfinishedResearch() {
    return this.researches.find(
      (research) => research.startedAt !== null && research.finishedAt === null,
    );
  }

  getUnrewardedResearch() {
    return this.researches.find(
      (research) => research.finishedAt !== null && research.rewardReceivedAt === null,
    );
  }
}
