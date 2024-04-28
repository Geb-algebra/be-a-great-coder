import { type LoaderFunctionArgs, type MetaFunction, json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { createContext, useState } from "react";
import Overlay from "~/components/Overlay.tsx";
import { TurnRepository } from "~/game/lifecycle/game.server";
import { authenticator } from "~/services/auth.server.ts";
import { ThemeContext } from "../../Contexts";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  });
  const turn = await TurnRepository.getOrThrow(user.id);
  return json({ user, turn });
}

export const meta: MetaFunction = () => {
  return [{ title: "New Remix App" }, { name: "description", content: "Welcome to Remix!" }];
};

export default function Index() {
  const { user, turn } = useLoaderData<typeof loader>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <ThemeContext.Provider
      value={["buy-ingredients", "sell-products"].includes(turn) ? "factory" : "lab"}
    >
      <div className="w-full h-screen bg-factory-accent-1">
        <Overlay isShown={isMenuOpen} setIsShown={setIsMenuOpen}>
          <div className="absolute right-6 top-20 w-64 bg-header-base text-header-text-dark rounded-lg overflow-hidden z-10">
            <Link
              to="/play/settings"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-header-text-dark hover:bg-header-accent"
            >
              Settings
            </Link>
            <Link
              to="/logout"
              className="block px-4 py-2 text-header-text-dark hover:bg-header-accent"
            >
              Log Out
            </Link>
          </div>
        </Overlay>
        <nav className="fixed w-full h-16 flex justify-between items-center bg-header-base text-header-text-dark rounded-b-[24px_12px]">
          <Link to="/play">
            <h1 className="text-2xl font-bold mx-6">Be A Great Coder</h1>
          </Link>
          <button type="button" className="px-6 h-full" onClick={() => setIsMenuOpen(true)}>
            <h2>{user.name}</h2>
          </button>
        </nav>
        <div className="pt-16 h-screen">
          <Outlet />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
