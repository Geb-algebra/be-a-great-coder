import { prisma } from '~/db.server.ts';

import {
  PROBLEM_UPDATE_INTERVAL,
  ENDPOINT,
  insertNewProblems,
} from '~/atcoder-info/models/problem.server.ts';
import { createFetchLog } from './fetcher.server.ts';

describe('updateProblems', () => {
  const PROBLEMS = [
    {
      id: 'abc158_d',
      contest_id: 'abc158',
      problem_index: 'D',
      name: 'String Formation',
      title: 'D. String Formation',
      shortest_submission_id: 21374338,
      shortest_contest_id: 'abc158',
      shortest_user_id: 'Fleur',
      fastest_submission_id: 10718722,
      fastest_contest_id: 'abc158',
      fastest_user_id: 'uzzy',
      first_submission_id: 10590545,
      first_contest_id: 'abc158',
      first_user_id: 'kort0n',
      source_code_length: 60,
      execution_time: 2,
      point: 400,
      solver_count: 11009,
    },
    {
      id: 'abc160_b',
      contest_id: 'abc160',
      problem_index: 'B',
      name: 'Golden Coins',
      title: 'B. Golden Coins',
      shortest_submission_id: 15256756,
      shortest_contest_id: 'abc160',
      shortest_user_id: 'Kude',
      fastest_submission_id: 11269061,
      fastest_contest_id: 'abc160',
      fastest_user_id: 'kotatsugame',
      first_submission_id: 11264470,
      first_contest_id: 'abc160',
      first_user_id: 'shun0923',
      source_code_length: 13,
      execution_time: 0,
      point: 200,
      solver_count: 19460,
    },
  ];
  beforeEach(async () => {
    await prisma.problem.create({ data: { id: 'xxxyyy', title: 'old problem', difficulty: 200 } });
  });
  it('should add all new problems without deleting any record', async () => {
    const lastFetchedTime = new Date(Date.now() - PROBLEM_UPDATE_INTERVAL * 1.1);
    await createFetchLog(ENDPOINT, 200, lastFetchedTime);
    const oldProbs = await prisma.problem.findMany();
    expect(oldProbs).toHaveLength(1);
    expect(oldProbs[0].title).toEqual('old problem');
    await insertNewProblems(PROBLEMS);
    const newProbs = await prisma.problem.findMany();
    expect(newProbs).toHaveLength(3);
    expect(newProbs[0].title).toEqual('old problem');
    expect(newProbs[1].title).toEqual('D. String Formation');
    expect(newProbs[2].title).toEqual('B. Golden Coins');
  });
});

// describe('queryAllProblemsByDifficulty', () => {
//   beforeEach(async () => {
//     // these are deleted by updating problems
//     for (const data of [
//       { id: '200_1', title: 'problem', difficulty: 200 },
//       { id: '200_2', title: 'problem', difficulty: 200 },
//       { id: '300_1', title: 'problem', difficulty: 300 },
//     ]) {
//       await prisma.problem.create({ data });
//     }
//     server.use(
//       http.get('https://kenkoooo.com/atcoder/resources/problems.json', () => {
//         return new Response(
//           JSON.stringify([
//             {
//               id: 'abc158_d',
//               contest_id: 'abc158',
//               problem_index: 'D',
//               name: 'String Formation',
//               title: 'D. String Formation',
//               shortest_submission_id: 21374338,
//               shortest_contest_id: 'abc158',
//               shortest_user_id: 'Fleur',
//               fastest_submission_id: 10718722,
//               fastest_contest_id: 'abc158',
//               fastest_user_id: 'uzzy',
//               first_submission_id: 10590545,
//               first_contest_id: 'abc158',
//               first_user_id: 'kort0n',
//               source_code_length: 60,
//               execution_time: 2,
//               point: 400,
//               solver_count: 11009,
//             },
//             {
//               id: 'abc160_b',
//               contest_id: 'abc160',
//               problem_index: 'B',
//               name: 'Golden Coins',
//               title: 'B. Golden Coins',
//               shortest_submission_id: 15256756,
//               shortest_contest_id: 'abc160',
//               shortest_user_id: 'Kude',
//               fastest_submission_id: 11269061,
//               fastest_contest_id: 'abc160',
//               fastest_user_id: 'kotatsugame',
//               first_submission_id: 11264470,
//               first_contest_id: 'abc160',
//               first_user_id: 'shun0923',
//               source_code_length: 13,
//               execution_time: 0,
//               point: 200,
//               solver_count: 19460,
//             },
//           ]),
//         );
//       }),
//     );
//   });
//   it('should fetch two problems with difficulty 200', async () => {
//     const probs = await queryAllProblemsByDifficulty(200);
//     expect(probs).toHaveLength(1);
//     for (const p of probs) {
//       expect(p.difficulty).toEqual(200);
//     }
//   });
// });
