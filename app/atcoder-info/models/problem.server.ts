import { fetchFromAtcoderAPI } from "~/atcoder-info/models/fetcher.server.ts";
import { prisma } from "~/db.server.ts";

export type { Problem } from "@prisma/client";

const fetchProblems = async () => {
  return await fetchFromAtcoderAPI("https://kenkoooo.com/atcoder/resources/merged-problems.json");
};

type problemDatum = {
  id: string;
  contest_id: string;
  problem_index: string;
  name: string;
  title: string;
  shortest_submission_id: number;
  shortest_contest_id: string;
  shortest_user_id: string;
  fastest_submission_id: number;
  fastest_contest_id: string;
  fastest_user_id: string;
  first_submission_id: number;
  first_contest_id: string;
  first_user_id: string;
  source_code_length: number;
  execution_time: number;
  point: number;
  solver_count: number;
};

export async function insertNewProblems(problems: problemDatum[]) {
  await prisma.$transaction(async (prisma) => {
    for (const datum of problems) {
      if (
        datum.point !== null && // some problems have no point in AtCoder
        datum.point <= 10000 && // some problems have weirdly huge points like 299238709281
        !datum.id.includes("ahc")
      ) {
        const exists = await prisma.problem.findUnique({
          where: {
            id: datum.id,
          },
        });
        if (!exists) {
          await prisma.problem.create({
            data: {
              id: datum.id,
              title: datum.title,
              difficulty: datum.point,
            },
          });
        }
      }
    }
  });
}

export const insertNewProblemsIfNeeded = async () => {
  const res = await fetchProblems();
  if (!res) return;
  if (res.status === 304) return;
  if (res.status !== 200) {
    console.error(`Failed to fetch problems: ${res.status}`);
    return;
  }
  const data: problemDatum[] = await res.json();
  await insertNewProblems(data);
};

export const queryAllProblemsByDifficulty = async (
  difficultyGte: number,
  difficultyLt: number,
  skipFetch = false,
) => {
  if (!skipFetch) await insertNewProblemsIfNeeded();
  return await prisma.problem.findMany({
    where: {
      difficulty: {
        lt: difficultyLt,
        gte: difficultyGte,
      },
    },
  });
};

export const queryRandomProblemByDifficulty = async (
  difficultyGte: number,
  difficultyLt: number,
  skipFetch = false,
) => {
  const problems = await queryAllProblemsByDifficulty(difficultyGte, difficultyLt, skipFetch);
  const index = Math.floor(Math.random() * problems.length);
  return problems[index];
};
