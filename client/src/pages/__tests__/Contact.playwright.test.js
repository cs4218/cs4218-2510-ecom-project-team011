import { test, expect } from "@playwright/test";

test.describe("Contact Integration Tests", () => {
  test("User should be able to visit contact page to get contact information", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page.getByRole("main")).toContainText(
      ": www.help@ecommerceapp.com"
    );
    await expect(page.getByRole("main")).toContainText(": 012-3456789");
    await expect(page.getByRole("main")).toContainText(
      ": 1800-0000-0000 (toll free)"
    );
  });
});
