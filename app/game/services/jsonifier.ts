import { Laboratory, type Problem, type Research, TotalAssets } from "../models/game";
import { INGREDIENTS } from "./config";

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
    const ingredientStock = new Map([...INGREDIENTS.keys()].map((id) => [id, 0]));
    for (const [id, amount] of json.ingredientStock) {
      if (!INGREDIENTS.has(id)) throw new Error(`Invalid ingredient name: ${id}`);
      ingredientStock.set(id, amount);
    }
    return new TotalAssets(json.cash, json.battery, ingredientStock);
  }
}

export type ResearchJson = {
  id: string;
  problem: Problem;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  submittedAt: string | null;
  solvedAt: string | null;
  finishedAt: string | null;
  answerShownAt: string | null;
  rewardReceivedAt: string | null;
  batteryCapacityExp: number | null;
  performanceExp: number | null;
};

export class ResearchJsonifier {
  static toJson(research: Research): ResearchJson {
    return {
      id: research.id,
      problem: research.problem,
      userId: research.userId,
      createdAt: research.createdAt.toISOString(),
      updatedAt: research.updatedAt.toISOString(),
      startedAt: research.startedAt?.toISOString() ?? null,
      submittedAt: research.submittedAt?.toISOString() ?? null,
      solvedAt: research.solvedAt?.toISOString() ?? null,
      finishedAt: research.finishedAt?.toISOString() ?? null,
      answerShownAt: research.answerShownAt?.toISOString() ?? null,
      rewardReceivedAt: research.rewardReceivedAt?.toISOString() ?? null,
      batteryCapacityExp: research.batteryCapacityExp,
      performanceExp: research.performanceExp,
    };
  }

  static fromJson(json: ResearchJson) {
    return {
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      startedAt: json.startedAt ? new Date(json.startedAt) : null,
      submittedAt: json.submittedAt ? new Date(json.submittedAt) : null,
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
