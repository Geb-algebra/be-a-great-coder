import { type MetaFunction, json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { queryAllProblemsByDifficulty, updateProblemsIfAllowed } from '~/models/problem.server.ts';
import { fetchNewSubmissions } from '~/services/atcoder.server.ts';
import { authenticator } from '~/services/auth.server.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/welcome',
  });
  await updateProblemsIfAllowed();
  const problems = await queryAllProblemsByDifficulty(100);

  const submissions = await fetchNewSubmissions(1560170952, 'some user');
  return json({ problems, submissions });
}

export const meta: MetaFunction = () => {
  return [{ title: '8bit stack' }];
};

export default function Index() {
  const { problems, submissions } = useLoaderData<typeof loader>();
  return (
    <ul>
      {submissions.map((submission: any) => (
        <li key={submission.id}>
          <span>{submission.id}</span>
        </li>
      ))}
      {problems.map((problem) => (
        <li key={problem.id}>
          <span>{problem.title}</span>
        </li>
      ))}
    </ul>
  );
}
