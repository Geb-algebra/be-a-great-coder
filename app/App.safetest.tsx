import { render } from "safetest/react";
import { describe, expect, it } from "safetest/vitest";

// Whole App testing
describe("App", () => {
  it("renders without crashing", async () => {
    const { page } = await render();
    await expect(page.locator("text=8bit stack")).toBeVisible();
  });
});
