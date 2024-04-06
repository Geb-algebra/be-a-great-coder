import { Outlet } from '@remix-run/react';

export default function AuthLayout() {
  return (
    <div className="flex min-h-full flex-col justify-center">
      <main className="pt-24 mx-auto w-[448px]">
        <Outlet />
      </main>
    </div>
  );
}
