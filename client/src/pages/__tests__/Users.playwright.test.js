import { test, expect } from "@playwright/test";

test.describe("Users Page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the admin authentication API endpoint
    await page.route("**/api/v1/auth/admin-auth", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          message: "Admin authenticated successfully"
        })
      });
    });

    // Mock admin authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: {
          _id: "admin123",
          name: "Admin User",
          email: "admin@example.com",
          role: 1
        },
        token: "admin-jwt-token"
      }));
    });
    
    await page.goto("/dashboard/admin/users");
  });

  test.describe("Native Component Tests", () => {
    test("should load Users page successfully", async ({ page }) => {
      await expect(page).toHaveTitle("Dashboard - All Users");
      await expect(page.locator("main")).toBeVisible();
    });

    test("should display 'All Users' heading", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
    });

    test("should display admin menu", async ({ page }) => {
      // Check for admin menu elements (assuming AdminMenu component renders navigation)
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });

    test("should be scrollable on the page", async ({ page }) => {
      await page.mouse.wheel(0, 100);
      await page.mouse.wheel(0, -100);
      
      // Content should still be visible after scrolling
      await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
    });

    test("should handle page load errors gracefully", async ({ page }) => {
      // Simulate network issues for specific endpoints, not auth
      await page.route("**/api/v1/product/**", route => route.abort());
      await page.route("**/api/v1/category/**", route => route.abort());
      
      await page.reload();
      
      // Page should still load and show basic content
      await expect(page).toHaveTitle("Dashboard - All Users");
      await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
    });

    test("should maintain functionality after page refresh", async ({ page }) => {
      await page.reload();
      
      // Page should still be functional
      await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });

    test("should maintain page state after navigation away and back", async ({ page }) => {
      // Navigate away
      await page.goto("/dashboard/admin");
      
      // Navigate back to users page
      await page.goto("/dashboard/admin/users");
      
      // Page should still be functional
      await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });

    test("should handle unauthorized access gracefully", async ({ page }) => {
      // Mock failed admin authentication
      await page.route("**/api/v1/auth/admin-auth", async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            ok: false,
            message: "Unauthorized admin access"
          })
        });
      });

      // Clear admin auth and try to access users page
      await page.addInitScript(() => {
        localStorage.removeItem('auth');
      });
    
      await page.goto("/dashboard/admin/users");
    
      // Should redirect to login or show unauthorized message
      await expect(page).toHaveURL(/.*login/);
    });

    test("should handle network errors gracefully", async ({ page }) => {
      // Simulate network issues for specific endpoints, not auth
      await page.route("**/api/v1/product/**", route => route.abort());
      await page.route("**/api/v1/category/**", route => route.abort());
    
      await page.reload();
    
      // Page should still load basic content
      await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
      });

    test("should handle invalid admin routes", async ({ page }) => {
      // Try to access non-existent admin routes
      await page.goto("/dashboard/admin/nonexistent");
    
      // Should either redirect or show appropriate error
      await expect(page).toHaveURL(/.*dashboard\/admin/);
    });

    test("should handle malformed URLs", async ({ page }) => {
      // Test with malformed URLs
      await page.goto("/dashboard/admin/users?invalid=param");
      
      // Page should still load correctly
      await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
    });
  });

  test.describe("Spinner Interaction Test", () => {
    test("should show spinner while loading and then route to users page", async ({ page }) => {
      // Mock admin authentication with delay to simulate API call and induce a spinner
      await page.addInitScript(() => {
        localStorage.setItem('auth', JSON.stringify({
          user: {
            _id: "admin123",
            name: "Admin User",
            email: "admin@example.com",
            role: 1
          },
          token: "admin-jwt-token"
        }));
      });

      // Mock the admin authentication API endpoint with delay
      await page.route("**/api/v1/auth/admin-auth", async (route) => {
        // Add delay to simulate API call time
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            message: "Admin authenticated successfully"
          })
        });
      });

      // Navigate to users page and verify spinner behavior
      await page.goto("/dashboard/admin/users");
      
      // Check that spinner is visible during loading
      await expect(page.getByRole("status")).toBeVisible();
      await expect(page.getByText(/redirecting to you in/i)).toBeVisible();
      
      // Wait for spinner to disappear and page to load
      await expect(page.getByRole("status")).not.toBeVisible();
      
      // Page should load successfully after spinner
      await expect(page).toHaveTitle("Dashboard - All Users");
      await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });
  });

  test.describe("Admin Menu Integration", () => {
    test("should display admin menu items", async ({ page }) => {
      // Test that admin menu is visible and functional
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });

    test("should navigate to admin dashboard from menu", async ({ page }) => {
      await page.getByText("Admin Dashboard").click();
      await expect(page).toHaveURL(/.*dashboard\/admin/);
    });

    test("should maintain admin menu functionality across navigation", async ({ page }) => {
      // Navigate away and back to test menu persistence
      await page.getByRole("link", { name: "Home" }).click();
      await expect(page).toHaveURL("/");
      
      // Navigate back to users page
      await page.goto("/dashboard/admin/users");
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });

    test("should preserve admin menu state after page refresh", async ({ page }) => {
      await page.reload();
      
      // Admin menu should still be functional
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });
  });

  //no need test for normal user cuz of admin
  //no need test for logged out because user will be redirected to login page, header should be tested by the dev working on login page testing
  test.describe("Header Component Tests", () => {

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
        await page.goto("/dashboard/admin/users");
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

      test("should maintain navigation functionality after page refresh", async ({ page }) => {
        await page.reload();
        
        // Navigation should still work after refresh
        await page.getByRole("link", { name: "Home" }).click();
        await expect(page).toHaveURL("/");
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
        
        await page.goto("/dashboard/admin/users");
        
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