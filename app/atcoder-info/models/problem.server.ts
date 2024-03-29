import { prisma } from '~/db.server.ts';
import { fetchIfAllowed } from '~/atcoder-info/models/fetcher.server.ts';

export type { Problem } from '@prisma/client';

export const PROBLEM_UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // one week in milliseconds
export const ENDPOINT = 'https://kenkoooo.com/atcoder/resources/merged-problems.json';

const fetchProblemsIfAllowed = async () => {
  return fetchIfAllowed(ENDPOINT, PROBLEM_UPDATE_INTERVAL);
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
  for (const datum of problems) {
    // some problems have no point in AtCoder
    const exists = await prisma.problem.findUnique({
      where: {
        id: datum.id,
      },
    });
    if (!exists && datum.point !== null && !datum.id.includes('ahc')) {
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

export const insertNewProblemsIfAllowed = async () => {
  const res = await fetchProblemsIfAllowed();
  if (res) {
    const data: problemDatum[] = await res.json();
    await insertNewProblems(data);
  }
};

export const queryAllProblemsByDifficulty = async (difficulty: number) => {
  await insertNewProblemsIfAllowed();
  return await prisma.problem.findMany({
    where: {
      difficulty,
    },
  });
};

/**
 * fetch all problems and choose one from them randomlu
 * @param difficulty: 100, 200, 300, 400, 500, 600
 */
export const queryRandomProblemByDifficulty = async (difficulty: number) => {
  const problems = await queryAllProblemsByDifficulty(difficulty);
  const index = Math.floor(Math.random() * problems.length);
  return problems[index];
};
