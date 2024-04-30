import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { screen, within } from "@testing-library/react";
import { AccountFactory, AccountRepository } from "~/accounts/lifecycle/account.server";
import { getSession, sessionStorage } from "~/services/session.server";

/**
 * Sets up an account and add a session to the request.
 * */
export async function setupAccount() {
  const account = await AccountFactory.create({
    name: "testuser",
    id: "testid",
  });
  await AccountRepository.save(account);
  return account;
}

/**
 * ! This function mutates the given request instance.
 */
export async function addAuthenticationSessionTo(request: Request) {
  const session = await getSession(request);
  session.set("user", { id: "testid", name: "testuser" });
  request.headers.set("cookie", await sessionStorage.commitSession(session));
}

export function authenticated(dataFunction: LoaderFunction | ActionFunction) {
  return async (
    args: Parameters<typeof dataFunction>[0],
  ): Promise<Awaited<ReturnType<typeof dataFunction>>> => {
    await addAuthenticationSessionTo(args.request);
    return dataFunction(args);
  };
}

export async function assertCurrentCashIsEqualTo(amount: number) {
  const status = await screen.findByRole("generic", { name: /player's status/i });
  await within(status).findByText(RegExp(`\\$ ${amount}`, "i"));
}

export async function assertCurrentIngredientStockIsEqualTo(
  ingredientName: string,
  amount: number,
) {
  const status = await screen.findByRole("generic", { name: /player's status/i });
  const stock = await within(status).findByRole("listitem", {
    name: RegExp(ingredientName, "i"),
  });
  await within(stock).findByText(RegExp(`${amount}`, "i"));
}

export async function assertCurrentResearcherRankIsEqualTo(rank: number) {
  const status = await screen.findByRole("generic", { name: /player's status/i });
  await within(status).findByText(RegExp(`rank: ${rank}`, "i"));
}

export async function assertCurrentBatteryIsEqualTo(amount: number) {
  const status = await screen.findByRole("generic", { name: /player's status/i });
  await within(status).findByText(RegExp(`battery: ${amount}`, "i"));
}

export async function assertCurrentBatteryCapacityIsEqualTo(amount: number) {
  const status = await screen.findByRole("generic", { name: /player's status/i });
  await within(status).findByText(RegExp(`battery: .* / ${amount}`, "i"));
}

export async function assertCurrentRobotPerformanceIsEqualTo(amount: number) {
  const status = await screen.findByRole("generic", { name: /player's status/i });
  await within(status).findByText(RegExp(`robot performance: ${amount}`, "i"));
}
