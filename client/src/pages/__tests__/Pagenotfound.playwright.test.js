import { test, expect } from "@playwright/test";
import { testAsLoggedOut } from "./testutils";

test.describe("Pagenotfound Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/nonexistent-page");
  });

  test.describe("Native Component Tests", () => {
    test("should load 404 page successfully", async ({ page }) => {
      await expect(page).toHaveTitle("go back- page not found");
      await expect(page.locator("main")).toBeVisible();
    });

    test("should display 404 error message", async ({ page }) => {
      await expect(page.getByText("404")).toBeVisible();
      await expect(page.getByText("Oops ! Page Not Found")).toBeVisible();
    });

    test("should display go back button", async ({ page }) => {
      await expect(page.getByRole("link", { name: "Go Back" })).toBeVisible();
    });

    test("should show all essential 404 elements", async ({ page }) => {
      await expect(page.getByText("404")).toBeVisible();
      await expect(page.getByText("Oops ! Page Not Found")).toBeVisible();
      await expect(page.getByRole("link", { name: "Go Back" })).toBeVisible();
    });

    test("should navigate to home when Go Back button is clicked", async ({ page }) => {
      await page.getByRole("link", { name: "Go Back" }).click();
      await expect(page).toHaveURL("/");
    });

    test("should be scrollable", async ({ page }) => {
      await page.mouse.wheel(0, 100);
      await page.mouse.wheel(0, -100);
      
      // Content should still be visible after scrolling
      await expect(page.getByText("404")).toBeVisible();
    });

    test("should handle various invalid URLs", async ({ page }) => {
      const invalidUrls = [
        "/invalid-page",
        "/random/url/that/does/not/exist",
        "/products/nonexistent-product"
      ];

      for (const url of invalidUrls) {
        await page.goto(url);
        await expect(page.getByText("404")).toBeVisible();
        await expect(page.getByText("Oops ! Page Not Found")).toBeVisible();
      }
    });

    test("should maintain functionality after page refresh", async ({ page }) => {
      await page.reload();
      
      // Page should still be functional
      await expect(page.getByText("404")).toBeVisible();
      await page.getByRole("link", { name: "Go Back" }).click();
      await expect(page).toHaveURL("/");
    });
  });

//   test.describe("Integration Tests with Header Component", () => {});
});