import { test, expect } from "@playwright/test";

test.describe("Policy Integration Tests", () => {
  test("User should be able to see placeholder picture if they visit the policy page", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page.getByRole("img", { name: "contactus" })).toBeVisible();
  });
});
