import { type MetaFunction, json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import Overlay from '~/components/Overlay.tsx';
import { authenticator } from '~/services/auth.server.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: '/',
  });

  return json(user);
}

export const meta: MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export default function Index() {
  const user = useLoaderData<typeof loader>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="w-full h-screen">
      <Overlay isShown={isMenuOpen} setIsShown={setIsMenuOpen}>
        <div className="absolute right-6 top-20 w-64 bg-white border border-gray-300 rounded-lg overflow-hidden z-10">
          <Link
            to="/play/settings"
            onClick={() => setIsMenuOpen(false)}
            className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
          >
            Settings
          </Link>
          <Link to="/logout" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
            Log Out
          </Link>
        </div>
      </Overlay>
      <nav className="fixed w-full h-16 flex justify-between items-center bg-white border-b border-gray-300">
        <Link to="/play">
          <h1 className="text-2xl font-bold mx-6">Be A Great Coder</h1>
        </Link>
        <button className="px-6 h-full" onClick={() => setIsMenuOpen(true)}>
          <h2>{user.name}</h2>
        </button>
      </nav>
      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  );
}
