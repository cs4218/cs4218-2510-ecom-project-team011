import { test, expect } from "@playwright/test";
import { testAsLoggedOut } from "./testutils";

// Top Down Approach: Mock data for search results AND authentication
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

  test.describe("Header Component Tests", () => {
    test.describe("Logged Out User", () => {
      test.beforeEach(async ({ page }) => {
        // Mock localStorage to simulate logged out state
        await page.addInitScript(() => {
          localStorage.setItem('auth', JSON.stringify({
            user: null,
            token: ""
          }));
        });
        await page.goto("/search");
      });

      test("should display login and register links for logged out user", async ({ page }) => {
        await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
      });

      test("should not display user dropdown for logged out user", async ({ page }) => {
        // Should not see user name or dashboard links
        await expect(page.getByText("Dashboard")).not.toBeVisible();
        await expect(page.getByText("Logout")).not.toBeVisible();
      });

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
    test.describe("Logged In User", () => {
      test.beforeEach(async ({ page }) => {
        // Mock localStorage to simulate logged in user
        await page.addInitScript(() => {
          localStorage.setItem('auth', JSON.stringify({
            user: {
              _id: "user123",
              name: "John Doe",
              email: "john@example.com",
              role: 0,
              phone: "1234567890",
              address: "123 Main St"
            },
            token: "mock-jwt-token"
          }));
        });
        await page.goto("/search");
      });

      test("should display user name and hide login/register links", async ({ page }) => {
        await expect(page.getByText("John Doe")).toBeVisible();
        await expect(page.getByRole("link", { name: "Register" })).not.toBeVisible();
        await expect(page.getByRole("link", { name: "Login" })).not.toBeVisible();
      });

      test("should show user dropdown menu when clicked", async ({ page }) => {
        await page.getByText("John Doe").click();
        await expect(page.getByText("Dashboard")).toBeVisible();
        await expect(page.getByText("Logout")).toBeVisible();
      });

      test("should navigate to user dashboard when Dashboard is clicked", async ({ page }) => {
        await page.getByText("John Doe").click();
        await page.getByRole("link", { name: "Dashboard" }).click();
        await expect(page).toHaveURL(/.*dashboard\/user/);
      });

      test("should logout when Logout is clicked", async ({ page }) => {
        await page.getByText("John Doe").click();
        await page.getByRole("link", { name: "Logout" }).click();
        
        // Should redirect to login and show login/register links
        await expect(page).toHaveURL(/.*login/);
        await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
      });

      test("should maintain other navigation functionality", async ({ page }) => {
        await page.getByRole("link", { name: "Home" }).click();
        await expect(page).toHaveURL("/");
        
        await page.getByRole("link", { name: "Cart" }).click();
        await expect(page).toHaveURL(/.*cart/);
      });
    });

    test.describe("Admin User", () => {
      test.beforeEach(async ({ page }) => {
        // Mock localStorage to simulate admin user
        await page.addInitScript(() => {
          localStorage.setItem('auth', JSON.stringify({
            user: {
              _id: "admin123",
              name: "Admin User",
              email: "admin@example.com",
              role: 1,
              phone: "5555555555",
              address: "Admin Office"
            },
            token: "mock-admin-jwt-token"
          }));
        });
        await page.goto("/search");
      });

      test("should display admin user name", async ({ page }) => {
        await expect(page.getByText("Admin User")).toBeVisible();
      });

      test("should navigate to admin dashboard when Dashboard is clicked", async ({ page }) => {
        await page.getByText("Admin User").click();
        await page.getByRole("link", { name: "Dashboard" }).click();
        await expect(page).toHaveURL(/.*dashboard\/admin/);
      });

      test("should have full navigation access", async ({ page }) => {
        await page.getByRole("link", { name: "Home" }).click();
        await expect(page).toHaveURL("/");
        
        await page.getByRole("link", { name: "Cart" }).click();
        await expect(page).toHaveURL(/.*cart/);
      });
    });

    test.describe("Authentication State Changes", () => {
      test("should update header when user logs in", async ({ page }) => {
        // Start as logged out
        await page.addInitScript(() => {
          localStorage.setItem('auth', JSON.stringify({
            user: null,
            token: ""
          }));
        });
        
        await page.goto("/search");
        
        // Should see login/register links
        await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
        
        // Simulate login by updating localStorage
        await page.evaluate(() => {
          localStorage.setItem('auth', JSON.stringify({
            user: {
              name: "John Doe",
              email: "john@example.com",
              role: 0 // Regular user
            },
            token: "mock-jwt-token"
          }));
        });
      });

      test("should display login and register links for logged out user", async ({ page }) => {
        await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
      });

      test("should not display user dropdown for logged out user", async ({ page }) => {
        // Should not see user name or dashboard links
        await expect(page.getByText("Dashboard")).not.toBeVisible();
        await expect(page.getByText("Logout")).not.toBeVisible();
      });
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
