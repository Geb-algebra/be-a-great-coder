import Layout, { loader as layoutLoader } from "./_layout.tsx";
import Page, { action, loader } from "./sell-products.tsx";
import { action as sellAction } from "./sell-products.$name.tsx";
import { render, screen } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import { authenticated, setupAccount } from "~/routes/test/utils.ts";
import { setBeginnersStatus, setVeteransStatus } from "~/routes/test/data.ts";
import { TotalAssetsRepository, TurnRepository } from "~/game/lifecycle/game.server.ts";
import type { Account } from "~/accounts/models/account.ts";
import userEvent from "@testing-library/user-event";
import { TURNS, TotalAssets } from "~/game/models/game.ts";

const RemixStub = createRemixStub([
  {
    path: "/play",
    loader: authenticated(layoutLoader),
    Component: Layout,
    children: [
      {
        path: "/play/sell-products",
        loader: authenticated(loader),
        action: authenticated(action),
        Component: Page,
        children: [
          {
            path: "/play/sell-products/sword",
            action: (args) => authenticated(sellAction)({ ...args, params: { name: "sword" } }),
          },
        ],
      },
      {
        path: "/play/router",
        Component: () => <div>Test Succeeded 😆</div>,
      },
    ],
  },
]);

describe.each([
  ["beginners", setBeginnersStatus, 1200, 16, 3],
  ["veterans", setVeteransStatus, 32768, 128, 136],
])("Page for %s", (_, statusSetter, cash, iron, battery) => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "sell-products");
  });

  it("renders the page", async () => {
    await statusSetter(account.id);
    render(<RemixStub initialEntries={["/play/sell-products"]} />);
    await screen.findByRole("heading", { name: /make and sell products/i });
    await screen.findByRole("button", { name: /make sword/i });
    await screen.findByRole("button", { name: /finish making products/i });
  });

  it("sells the item when the button is clicked", async () => {
    await statusSetter(account.id);
    render(<RemixStub initialEntries={["/play/sell-products"]} />);
    await screen.findByText(RegExp(`cash: ${cash}`, "i"));
    await screen.findByText(RegExp(`iron: ${iron}`, "i"));
    await screen.findByText(RegExp(`battery: ${battery}`, "i"));
    const makeSwordButton = await screen.findByRole("button", { name: /make sword/i });
    const user = userEvent.setup();
    await user.click(makeSwordButton);
    await screen.findByText(RegExp(`cash: ${cash + 400}`, "i"));
    await screen.findByText(RegExp(`iron: ${iron - 3}`, "i"));
    await screen.findByText(RegExp(`battery: ${battery - 1}`, "i"));
  });

  it("throws an error if the user doesnt have enough ingredients", async () => {
    await statusSetter(account.id);
    const newAssets = new TotalAssets(cash, battery, new Map([["iron", 0]]));
    await TotalAssetsRepository.save(account.id, newAssets);
    render(<RemixStub initialEntries={["/play/sell-products"]} />);
    await screen.findByText(/iron: 0/i);
    const makeSwordButton = await screen.findByRole("button", { name: /make sword/i });
    const user = userEvent.setup();
    await user.click(makeSwordButton);
    await screen.findByText(/not enough ingredients/i);
  });

  it("throws an error if the user doesnt have enough battery", async () => {
    await statusSetter(account.id);
    const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
    const newAssets = new TotalAssets(cash, 0, totalAssets.ingredientStock);
    await TotalAssetsRepository.save(account.id, newAssets);
    render(<RemixStub initialEntries={["/play/sell-products"]} />);
    await screen.findByText(/battery: 0/i);
    const makeSwordButton = await screen.findByRole("button", { name: /make sword/i });
    const user = userEvent.setup();
    await user.click(makeSwordButton);
    await screen.findByText(/not enough battery/i);
  });

  it.each(TURNS.filter((v) => v !== "sell-products"))(
    "redirects to /play/router if the turn is %s",
    async (turn) => {
      await statusSetter(account.id);
      await TurnRepository.save(account.id, turn);
      render(<RemixStub initialEntries={["/play/sell-products"]} />);
      await screen.findByText(/test succeeded/i);
    },
  );

  it("redirects to /play/router after clicking the finish buying button", async () => {
    await statusSetter(account.id);
    render(<RemixStub initialEntries={["/play/sell-products"]} />);
    const finishButton = await screen.findByRole("button", { name: /finish making products/i });
    const user = userEvent.setup();
    await user.click(finishButton);
    await screen.findByText(/test succeeded/i);
  });
});
