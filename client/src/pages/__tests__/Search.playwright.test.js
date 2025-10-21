import { test, expect } from "@playwright/test";
import { testAsLoggedOut } from "./testutils";

// Top Down Approach: Mock data for search results
const mockProducts = [
  {
    _id: "1",
    name: "Laptop Pro",
    description: "High-performance laptop for professionals",
    price: 1299.99,
    category: { name: "Electronics" },
    quantity: 10,
    shipping: true
  },
  {
    _id: "2", 
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with long battery life",
    price: 29.99,
    category: { name: "Electronics" },
    quantity: 50,
    shipping: true
  },
  {
    _id: "3",
    name: "Smartphone",
    description: "Latest model smartphone with advanced features", 
    price: 899.99,
    category: { name: "Electronics" },
    quantity: 15,
    shipping: true
  },
  {
    _id: "4",
    name: "Jeans",
    description: "Classic blue denim jeans",
    price: 59.99,
    category: { name: "Clothing" },
    quantity: 75,
    shipping: true
  }
];

test.describe("Search Page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock search API responses
    await page.route("**/api/v1/product/search/**", async (route) => {
      const url = route.request().url();
      const searchTerm = url.split('/').pop();
      
      let response;
      if (searchTerm === "laptop") {
        response = {
          success: true,
          message: "Search completed successfully",
          results: [mockProducts[0]] // Laptop Pro
        };
      } else if (searchTerm === "mouse") {
        response = {
          success: true,
          message: "Search completed successfully", 
          results: [mockProducts[1]] // Wireless Mouse
        };
      } else if (searchTerm === "smartphone") {
        response = {
          success: true,
          message: "Search completed successfully",
          results: [mockProducts[2]] // Smartphone
        };
      } else if (searchTerm === "jeans") {
        response = {
          success: true,
          message: "Search completed successfully",
          results: [mockProducts[3]] // Jeans
        };
      } else {
        response = {
          success: true,
          message: "Search completed successfully",
          results: [] // No results
        };
      }
      
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response)
      });
    });
    
    await page.goto("/search");
  });

  test.describe("Native Component Tests", () => {
    test("should load search page successfully", async ({ page }) => {
      await expect(page).toHaveTitle("Search results");
      await expect(page.locator("main")).toBeVisible();
    });

    test("should display search results heading", async ({ page }) => {
      await expect(page.getByText("Search Results")).toBeVisible();
    });

    test("should show no products found message when no results", async ({ page }) => {
      await expect(page.getByText("No Products Found")).toBeVisible();
    });

    test("should display search results when products are found", async ({ page }) => {
      // Navigate to search with a query that might return results
      await page.goto("/");
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      await searchInput.fill("laptop");
      await searchInput.press("Enter");
      
      // Should navigate to search page
      await expect(page).toHaveURL(/.*search/);
      
      // Should find results from mocked API
      await expect(page.getByText("Found 1")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Laptop Pro" })).toBeVisible();
    });

    test("should show product cards when results are available", async ({ page }) => {
      // This test assumes there might be products in the system
      // Navigate to search with a query
      await page.goto("/");
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      await searchInput.fill("mouse");
      await searchInput.press("Enter");
      
      await expect(page).toHaveURL(/.*search/);
      
      // Should find results from mocked API
      await expect(page.getByText("Found 1")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Wireless Mouse" })).toBeVisible();
    });

    test("should be scrollable on the page", async ({ page }) => {
      await page.mouse.wheel(0, 100);
      await page.mouse.wheel(0, -100);
      
      // Content should still be visible after scrolling
      await expect(page.getByText("Search Results")).toBeVisible();
    });

    test("should handle page load errors gracefully", async ({ page }) => {
      // Simulate network issues by blocking API calls
      await page.route("**/api/v1/product/search/**", route => route.abort());
      
      await page.goto("/search");
      
      // Page should still load and show no results message
      await expect(page).toHaveTitle("Search results");
      await expect(page.getByText("No Products Found")).toBeVisible();
    });

    test("should maintain functionality after page refresh", async ({ page }) => {
      await page.reload();
      
      // Page should still be functional
      await expect(page.getByText("Search Results")).toBeVisible();
      await expect(page.getByText("No Products Found")).toBeVisible();
    });

    test("should show no results for non-existent products", async ({ page }) => {
      // Search for something that doesn't exist in mocked data
      await page.goto("/");
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      await searchInput.fill("nonexistentproduct");
      await searchInput.press("Enter");
      
      await expect(page).toHaveURL(/.*search/);
      
      // Should show no results message
      await expect(page.getByText("No Products Found")).toBeVisible();
    });

    test("should display product details in search results", async ({ page }) => {
      // Search for "smartphone" which exists in mocked data
      await page.goto("/");
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      await searchInput.fill("smartphone");
      await searchInput.press("Enter");
      
      await expect(page).toHaveURL(/.*search/);
      
      // Should show product details from mocked API
      await expect(page.getByRole("heading", { name: "Smartphone" })).toBeVisible();
      await expect(page.getByText("Latest model smartphone")).toBeVisible();
      await expect(page.getByText("$ 899.99")).toBeVisible();
    });

    test("should search for clothing items", async ({ page }) => {
      // Search for "jeans" which exists in mocked data
      await page.goto("/");
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      await searchInput.fill("jeans");
      await searchInput.press("Enter");
      
      await expect(page).toHaveURL(/.*search/);
      
      // Should find results from mocked API
      await expect(page.getByText("Found 1")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Jeans" })).toBeVisible();
      await expect(page.getByText("Classic blue denim jeans")).toBeVisible();
      await expect(page.getByText("$ 59.99")).toBeVisible();
    });

    test("should display correct price format for all products", async ({ page }) => {
      // Test laptop price
      await page.goto("/");
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      await searchInput.fill("laptop");
      await searchInput.press("Enter");
      await expect(page).toHaveURL(/.*search/);
      await expect(page.getByText("$ 1299.99")).toBeVisible();

      // Test mouse price
      await page.goto("/");
      await searchInput.fill("mouse");
      await searchInput.press("Enter");
      await expect(page).toHaveURL(/.*search/);
      await expect(page.getByText("$ 29.99")).toBeVisible();
    });
  });
});
