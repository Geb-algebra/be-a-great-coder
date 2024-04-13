import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Outlet } from "react-router-dom";

export const meta: MetaFunction = () => {
  return [{ title: "Sign Up" }];
};

export default function LoginPage() {
  return (
    <>
      <Outlet />
      <div className="pt-6 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-500 underline">
          Log In
        </Link>
      </div>
    </>
  );
}
