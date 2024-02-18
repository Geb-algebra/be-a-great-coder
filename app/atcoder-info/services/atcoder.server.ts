export async function fetchNewSubmissions(startEpochSeconds: number, atCoderUsername: string) {
  const res = await fetch(
    `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${atCoderUsername}&from_second=${startEpochSeconds}`,
    { headers: [['ACCEPT-ENCODING', 'gzip']] },
  );
  return await res.json();
}
