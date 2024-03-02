import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { authenticator } from '~/services/auth.server.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, { successRedirect: '/play' });
  return json({});
}

export const meta: MetaFunction = () => {
  return [{ title: '' }];
};

export default function Page() {
  return (
    <div className="flex justify-center">
      <div>
        <h1 className="font-mono font-bold text-5xl my-12">8bit Stack</h1>
        <Link to="/login">
          <button className="border border-gray-300 bg-white hover:bg-gray-100 py-3 w-32 rounded-lg mx-6 text-xl">
            Log In
          </button>
        </Link>
        <Link to="/signup">
          <button className="bg-black text-white hover:bg-gray-700 py-3 w-32 rounded-lg mx-6 text-xl">
            Sign Up
          </button>
        </Link>
      </div>
    </div>
  );
}
