export const TURNS = [
  'buy-ingredients',
  'sell-products',
  'select-problems',
  'solve-problems',
  'get-reward',
] as const;
export type Turn = (typeof TURNS)[number];

export class TotalAssets {
  readonly cash: number;
  readonly battery: number;
  private _ingredientStock: Map<string, number>;

  constructor(money: number, battery: number, ingredientStock: Map<string, number>) {
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
  explanationDisplayedAt: Date | null;
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
      (acc, research) => acc + (research.performanceIncrement ?? 0),
      1,
    );
  }

  get performance() {
    return this.rewardedResearches.reduce(
      (acc, research) => acc + (research.batteryCapacityIncrement ?? 0),
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

  getRewardUnreceivedResearch() {
    return this.researches.find(
      (research) => research.finishedAt !== null && research.rewardReceivedAt === null,
    );
  }
}
