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

  test.describe("Header Component Tests", () => {
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

    test("should navigate to search page when Search link is clicked", async ({ page }) => {
      await page.getByRole("link", { name: "Search" }).click();
      await expect(page).toHaveURL(/.*search/);
    });

    test("should preserve header functionality across page navigation", async ({ page }) => {
      await page.getByRole("link", { name: "Cart" }).click();
      await expect(page).toHaveURL(/.*cart/);
      await page.goBack();
      
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

    test("should maintain navigation functionality after page refresh", async ({ page }) => {
      await page.reload();
      
      // Navigation should still work after refresh
      await page.getByRole("link", { name: "Home" }).click();
      await expect(page).toHaveURL("/");
    });
  });

  test.describe("Footer Component Tests", () => {
    test("should display footer content", async ({ page }) => {
      await expect(page.getByText("All Rights Reserved")).toBeVisible();
      await expect(page.getByText("About")).toBeVisible();
      await expect(page.getByText("Contact")).toBeVisible();
      await expect(page.getByText("Privacy Policy")).toBeVisible();
    });

    test("should navigate to about page when About link is clicked", async ({ page }) => {
      await page.getByRole("link", { name: "About" }).click();
      await expect(page).toHaveURL(/.*about/);
    });

    test("should navigate to contact page when Contact link is clicked", async ({ page }) => {
      await page.getByRole("link", { name: "Contact" }).click();
      await expect(page).toHaveURL(/.*contact/);
    });

    test("should navigate to policy page when Privacy Policy link is clicked", async ({ page }) => {
      await page.getByRole("link", { name: "Privacy Policy" }).click();
      await expect(page).toHaveURL(/.*policy/);
    });

    test("should maintain footer functionality across page navigation", async ({ page }) => {
      await page.getByRole("link", { name: "Contact" }).click();
      await expect(page).toHaveURL(/.*contact/);
      await page.goBack();
      
      // Footer should still be functional
      await page.getByRole("link", { name: "Privacy Policy" }).click();
      await expect(page).toHaveURL(/.*policy/);
    });

    test("should handle footer navigation after page refresh", async ({ page }) => {
      await page.reload();
      
      // Footer navigation should still work after refresh
      await page.getByRole("link", { name: "Contact" }).click();
      await expect(page).toHaveURL(/.*contact/);
    });
  });
});