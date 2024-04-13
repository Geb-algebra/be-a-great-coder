import { Laboratory, type Problem, TotalAssets, type Research } from "../models/game";

export type TotalAssetsJson = {
  cash: number;
  battery: number;
  ingredientStock: [string, number][];
};

export class TotalAssetsJsonifier {
  static toJson(totalAssets: TotalAssets): TotalAssetsJson {
    return {
      cash: totalAssets.cash,
      battery: totalAssets.battery,
      ingredientStock: Array.from(totalAssets.ingredientStock),
    };
  }

  static fromJson(json: TotalAssetsJson) {
    return new TotalAssets(json.cash, json.battery, new Map(json.ingredientStock));
  }
}

export type ResearchJson = {
  id: string;
  problem: Problem;
  userId: string;
  createdAt: string;
  updatedAt: string;
  solvedAt: string | null;
  finishedAt: string | null;
  answerShownAt: string | null;
  rewardReceivedAt: string | null;
  batteryCapacityIncrement: number | null;
  performanceIncrement: number | null;
};

export class ResearchJsonifier {
  static toJson(research: Research): ResearchJson {
    return {
      id: research.id,
      problem: research.problem,
      userId: research.userId,
      createdAt: research.createdAt.toISOString(),
      updatedAt: research.updatedAt.toISOString(),
      solvedAt: research.solvedAt?.toISOString() ?? null,
      finishedAt: research.finishedAt?.toISOString() ?? null,
      answerShownAt: research.answerShownAt?.toISOString() ?? null,
      rewardReceivedAt: research.rewardReceivedAt?.toISOString() ?? null,
      batteryCapacityIncrement: research.batteryCapacityIncrement,
      performanceIncrement: research.performanceIncrement,
    };
  }

  static fromJson(json: ResearchJson) {
    return {
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      solvedAt: json.solvedAt ? new Date(json.solvedAt) : null,
      finishedAt: json.finishedAt ? new Date(json.finishedAt) : null,
      answerShownAt: json.answerShownAt ? new Date(json.answerShownAt) : null,
      rewardReceivedAt: json.rewardReceivedAt ? new Date(json.rewardReceivedAt) : null,
    };
  }
}

export type LaboratoryJson = {
  researches: ResearchJson[];
};

export class LaboratoryJsonifier {
  static toJson(laboratory: Laboratory): LaboratoryJson {
    return {
      researches: laboratory.researches.map((research) => ResearchJsonifier.toJson(research)),
    };
  }

  static fromJson(json: LaboratoryJson) {
    return new Laboratory(json.researches.map((research) => ResearchJsonifier.fromJson(research)));
  }
}
