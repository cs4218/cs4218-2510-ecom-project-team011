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
        await page.goto("/nonexistent-page");
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
        await page.goto("/nonexistent-page");
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
        await page.goto("/nonexistent-page");
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
        
        await page.goto("/nonexistent-page");
        
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