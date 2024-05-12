export type SwordElement = "plain" | "fire" | "water" | "light";
export type SwordGrade = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Sword = {
  name: string;
  price: number;
  grade: number;
  element: SwordElement;
};
