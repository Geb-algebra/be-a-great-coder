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

export async function fetchNewSubmissions(
  startEpochSeconds: number,
  atCoderUsername: string,
): Promise<submissionDatum[]> {
  const res = await fetch(
    `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${atCoderUsername}&from_second=${startEpochSeconds}`,
    { headers: [["ACCEPT-ENCODING", "gzip"]] },
  );
  return (await res.json()) as submissionDatum[];
}

export async function getProblemSolvedTime(
  problemId: string,
  atCoderUsername: string,
  startEpochSeconds: number,
) {
  const newSubmissions = await fetchNewSubmissions(startEpochSeconds, atCoderUsername);
  // newSubmissions is sorted by epoch_second in ascending order.
  const earliestSubmission = newSubmissions.find(
    (submission: any) => submission.problem_id === problemId,
  );
  return earliestSubmission ? new Date(earliestSubmission.epoch_second * 1000) : null;
}
