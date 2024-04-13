import { addAuthenticationSessionTo, setupAccount } from "~/routes/test/utils.ts";
import { setVeteransStatus } from "~/routes/test/data.ts";
import { action } from "./sell-products.$name.tsx";
import type { Account } from "~/accounts/models/account";
import { TotalAssetsRepository, TurnRepository } from "~/game/lifecycle/game.server";

describe("action", () => {
  let account: Account;
  beforeEach(async () => {
    account = await setupAccount();
    await TurnRepository.save(account.id, "buy-ingredients");
  });
  it("should make and sell a sword", async () => {
    await setVeteransStatus(account.id);
    const request = new Request("http://localhost:3000/play/sell-products/iron", {
      method: "POST",
    });
    await addAuthenticationSessionTo(request);
    const response = await action({ request, params: { name: "iron" }, context: {} });
    expect(response).toBeNull();
    const totalAssets = await TotalAssetsRepository.getOrThrow(account.id);
    expect(totalAssets.cash).toBe(32768 + 400);
    expect(totalAssets.ingredientStock.get("iron")).toBe(128 - 3);
  });
});
