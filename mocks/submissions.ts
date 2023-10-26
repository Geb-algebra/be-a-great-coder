import { http, HttpResponse } from 'msw';

type submissionDatum = {
  id: number;
  epoch_second: number;
  problem_id: string;
  contest_id: string;
  user_id: string;
  language: string;
  point: number;
  length: number;
  result: string;
  execution_time: number;
};

export const submissionsMock = http.get(
  'https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions',
  () => {
    return new Response(
      JSON.stringify([
        // {
        //   id: 5870139,
        //   epoch_second: 1560170952,
        //   problem_id: 'abc121_c',
        //   contest_id: 'abc121',
        //   user_id: 'chokudai',
        //   language: 'C# (Mono 4.6.2.0)',
        //   point: 0.0,
        //   length: 754,
        //   result: 'WA',
        //   execution_time: 143,
        // },
      ]),
      { status: 200 },
    );
  },
);
