import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Outlet } from "react-router-dom";

export const meta: MetaFunction = () => {
  return [{ title: "Log In" }];
};

export default function LoginPage() {
  return (
    <>
      <Outlet />
      <div className="pt-6 text-center">
        Do not have an account?{" "}
        <Link to="/signup" className="text-blue-500 underline">
          Sign Up
        </Link>
      </div>
    </>
  );
}
