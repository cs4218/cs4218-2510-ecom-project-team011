import { test, expect } from "@playwright/test";
import { testAsLoggedOut } from "./testutils";

test.describe("About Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about");
  });

  test.describe("Native Component Tests", () => {
    test("should load About page successfully", async ({ page }) => {
      await expect(page).toHaveTitle("About us - Ecommerce app");
      await expect(page.locator("main")).toBeVisible();
    });

    test("should be accessible from navigation menu", async ({ page }) => {
      await page.goto("/");
      const aboutLink = page.locator('a[href="/about"]').first();
      if (await aboutLink.isVisible()) {
        await aboutLink.click();
        await expect(page).toHaveURL(/.*about/);
        await expect(page).toHaveTitle("About us - Ecommerce app");
      }
    });

    test("should display about image", async ({ page }) => {
      const aboutImage = page.locator('img[alt="contactus"]');
      await expect(aboutImage).toBeVisible();
    });

    test("should display about text content", async ({ page }) => {
      const aboutText = page.locator("text=Add text");
      await expect(aboutText).toBeVisible();
    });

    test("should show both image and text sections", async ({ page }) => {
      await expect(page.locator('img[alt="contactus"]')).toBeVisible();
      await expect(page.locator("text=Add text")).toBeVisible();
    });

    test("should be scrollable", async ({ page }) => {
      await page.mouse.wheel(0, 100);
      await page.mouse.wheel(0, -100);
      
      // Content should still be visible after scrolling
      await expect(page.locator('img[alt="contactus"]')).toBeVisible();
    });

    test("should handle page load errors gracefully", async ({ page }) => {
      // Simulate network issues by blocking the image
      await page.route("**/images/about.jpeg", route => route.abort());
      
      await page.goto("/about");
      
      // Page should still load=
      await expect(page).toHaveTitle("About us - Ecommerce app");
    });
  });

  test.describe("Integration Tests with Header Component", () => {
      test("should navigate to home when brand logo is clicked", async ({ page }) => {
        await page.getByRole("link", { name: "🛒 Virtual Vault" }).click();
        await expect(page).toHaveURL("/");
      });

      test("should navigate to home page when Home link is clicked", async ({ page }) => {
        await page.getByRole("link", { name: "Home" }).click();
        await expect(page).toHaveURL("/");
      });

      test("should show dropdown menu when Categories is clicked", async ({ page }) => {
        await page.getByRole("link", { name: "Categories" }).click();
        await expect(page.getByText("All Categories")).toBeVisible();
      });

      test("should navigate to categories page when All Categories is clicked", async ({ page }) => {
        await page.getByRole("link", { name: "Categories" }).click();
        await page.getByRole("link", { name: "All Categories" }).click();
        await expect(page).toHaveURL(/.*categories/);
      });

      test("should navigate to cart page when Cart link is clicked", async ({ page }) => {
        await page.getByRole("link", { name: "Cart" }).click();
        await expect(page).toHaveURL(/.*cart/);
      });
      
      test("should navigate to register page when Register link is clicked", async ({ page }) => {
        await page.getByRole("link", { name: "Register" }).click();
        await expect(page).toHaveURL(/.*register/);
      });

      test("should navigate to login page when Login link is clicked", async ({ page }) => {
        await page.getByRole("link", { name: "Login" }).click();
        await expect(page).toHaveURL(/.*login/);
      });

      test("should allow typing in search input", async ({ page }) => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        await searchInput.fill("test search");
        await expect(searchInput).toHaveValue("test search");
      });

      test("should clear search input when cleared", async ({ page }) => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        await searchInput.fill("test");
        await searchInput.clear();
        await expect(searchInput).toHaveValue("");
      });

      test("should maintain navigation state when returning to about page", async ({ page }) => {
        // Navigate away and back
        await page.getByRole("link", { name: "Home" }).click();
        await page.goto("/about");
        
        // Navigation should still work - hover to show dropdown then click All Categories
        await page.getByRole("link", { name: "Categories" }).click();
        await page.getByRole("link", { name: "All Categories" }).click();
        await expect(page).toHaveURL(/.*categories/);
      });

      test("should preserve header functionality across page navigation", async ({ page }) => {
        // Test navigation from about page
        await page.getByRole("link", { name: "Cart" }).click();
        await expect(page).toHaveURL(/.*cart/);
        
        // Navigate back to about
        await page.goto("/about");
        
        // Header should still be functional
        await page.getByRole("link", { name: "Home" }).click();
        await expect(page).toHaveURL("/");
      });

      test("should navigate using keyboard tab navigation", async ({ page }) => {
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        await page.keyboard.press("Enter");
        
        // Should navigate to the focused link
        await expect(page).toHaveURL("/");
      });

      test("should handle navigation when links are clicked rapidly", async ({ page }) => {
        // Rapid clicking should not break navigation
        await page.getByRole("link", { name: "Home" }).click();
        await page.goto("/about");
        await page.getByRole("link", { name: "Categories" }).click();
        await page.goto("/about");
        await page.getByRole("link", { name: "Cart" }).click();
        
        // Should end up on cart page
        await expect(page).toHaveURL(/.*cart/);
      });

      test("should maintain navigation functionality after page refresh", async ({ page }) => {
        await page.reload();
        
        // Navigation should still work after refresh
        await page.getByRole("link", { name: "Home" }).click();
        await expect(page).toHaveURL("/");
    });
  });
});