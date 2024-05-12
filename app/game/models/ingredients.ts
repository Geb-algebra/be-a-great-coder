import { GameLogicViolated } from "~/errors";
import type { SwordElement, SwordGrade } from "./swords";

export type BaseMetal = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export type Gem = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export type Ingredient = BaseMetal | Gem;
