import { test, expect } from "@playwright/test";

// Top Down Approach: Mock data for products AND authentication
const mockProducts = [
  {
    _id: "1",
    name: "Laptop Pro",
    description: "High-performance laptop for professionals",
    slug: "laptop-pro",
    price: 1299.99,
    category: { name: "Electronics" },
    quantity: 10,
    shipping: true
  },
  {
    _id: "2", 
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with long battery life",
    slug: "wireless-mouse",
    price: 29.99,
    category: { name: "Electronics" },
    quantity: 50,
    shipping: true
  },
  {
    _id: "3",
    name: "Smartphone",
    description: "Latest model smartphone with advanced features", 
    slug: "smartphone",
    price: 899.99,
    category: { name: "Electronics" },
    quantity: 15,
    shipping: true
  },
  {
    _id: "4",
    name: "Jeans",
    description: "Classic blue denim jeans",
    slug: "jeans",
    price: 59.99,
    category: { name: "Clothing" },
    quantity: 75,
    shipping: true
  }
];

test.describe("Products Page", () => {
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

    // Mock the products API endpoint
    await page.route("**/api/v1/product/get-product", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          products: mockProducts
        })
      });
    });

    // Mock product images
    await page.route("**/api/v1/product/product-photo/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: Buffer.from("fake-image-data")
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
    
    await page.goto("/dashboard/admin/products");
  });

  test.describe("Native Component Tests", () => {
    test("should load Products page successfully", async ({ page }) => {
      await expect(page).toHaveTitle("Dashboard - All Products");
      await expect(page.locator("main")).toBeVisible();
    });

    test("should display 'All Products List' heading", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "All Products List" })).toBeVisible();
    });

    test("should display admin menu", async ({ page }) => {
      // Check for admin menu elements
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });

    test("should display all products from API", async ({ page }) => {
      // Wait for products to load
      await expect(page.getByRole("heading", { name: "Laptop Pro" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Wireless Mouse" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Smartphone" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Jeans" })).toBeVisible();
    });

    test("should display product descriptions", async ({ page }) => {
      await expect(page.getByText("High-performance laptop for professionals")).toBeVisible();
      await expect(page.getByText("Ergonomic wireless mouse with long battery life")).toBeVisible();
      await expect(page.getByText("Latest model smartphone with advanced features")).toBeVisible();
      await expect(page.getByText("Classic blue denim jeans")).toBeVisible();
    });

    test("should display product images", async ({ page }) => {
      // Check that product images are loaded
      const images = page.locator('img[alt*="Laptop Pro"], img[alt*="Wireless Mouse"], img[alt*="Smartphone"], img[alt*="Jeans"]');
      await expect(images.first()).toBeVisible();
    });

    test("should be scrollable on the page", async ({ page }) => {
      await page.mouse.wheel(0, 100);
      await page.mouse.wheel(0, -100);
      
      // Content should still be visible after scrolling
      await expect(page.getByRole("heading", { name: "All Products List" })).toBeVisible();
    });

    test("should handle page load errors gracefully", async ({ page }) => {
      // Simulate network issues for specific endpoints, not auth
      await page.route("**/api/v1/product/get-product", route => route.abort());
      
      await page.reload();
      
      // Page should still load and show basic content
      await expect(page).toHaveTitle("Dashboard - All Products");
      await expect(page.getByRole("heading", { name: "All Products List" })).toBeVisible();
    });

    test("should maintain functionality after page refresh", async ({ page }) => {
      await page.reload();
      
      // Page should still be functional
      await expect(page.getByRole("heading", { name: "All Products List" })).toBeVisible();
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });

    test("should maintain page state after navigation away and back", async ({ page }) => {
      // Navigate away
      await page.goto("/dashboard/admin");
      
      // Navigate back to products page
      await page.goto("/dashboard/admin/products");
      
      // Page should still be functional
      await expect(page.getByRole("heading", { name: "All Products List" })).toBeVisible();
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
    });

    test("should navigate to product details when product is clicked", async ({ page }) => {
      // Click on the first product (Laptop Pro)
      await page.getByRole("heading", { name: "Laptop Pro" }).click();
      await expect(page).toHaveURL(/.*dashboard\/admin\/product\/laptop-pro/);
    });

    test("should navigate to different product details", async ({ page }) => {
      // Click on Wireless Mouse
      await page.getByRole("heading", { name: "Wireless Mouse" }).click();
      await expect(page).toHaveURL(/.*dashboard\/admin\/product\/wireless-mouse/);
    });

    test("should navigate to smartphone product details", async ({ page }) => {
      // Click on Smartphone
      await page.getByRole("heading", { name: "Smartphone" }).click();
      await expect(page).toHaveURL(/.*dashboard\/admin\/product\/smartphone/);
    });

    test("should navigate to jeans product details", async ({ page }) => {
      // Click on Jeans
      await page.getByRole("heading", { name: "Jeans" }).click();
      await expect(page).toHaveURL(/.*dashboard\/admin\/product\/jeans/);
    });

    test("should maintain navigation state after returning to products page", async ({ page }) => {
      // Navigate to a product and back
      await page.getByRole("heading", { name: "Laptop Pro" }).click();
      await expect(page).toHaveURL(/.*dashboard\/admin\/product\/laptop-pro/);
      
      await page.goBack();
      await expect(page).toHaveURL(/.*dashboard\/admin\/products/);
      
      // Products should still be visible
      await expect(page.getByRole("heading", { name: "Laptop Pro" })).toBeVisible();
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
  
        // Clear admin auth and try to access products page
        await page.addInitScript(() => {
          localStorage.removeItem('auth');
        });
      
        await page.goto("/dashboard/admin/products");
      
        // Should redirect to login or show unauthorized message
        await expect(page).toHaveURL(/.*login/);
      });
  
      test("should handle network errors gracefully", async ({ page }) => {
        // Simulate network issues for specific endpoints, not auth
        await page.route("**/api/v1/product/get-product", route => route.abort());
        
        await page.reload();
        
        // Page should still load basic content
        await expect(page.getByRole("heading", { name: "All Products List" })).toBeVisible();
      });
  });

  test.describe("Admin Menu Integration", () => {
    test("should display admin menu items", async ({ page }) => {
      // Test that admin menu is visible and functional
      await expect(page.getByText("Admin Dashboard")).toBeVisible();
      await expect(page.getByText("Create Category")).toBeVisible();
      await expect(page.getByText("Create Product")).toBeVisible();
      await expect(page.getByRole("link", { name: "Products" })).toBeVisible();
      await expect(page.getByText("Orders")).toBeVisible();
    });

    test("should navigate to create category from menu", async ({ page }) => {
      await page.getByText("Create Category").click();
      await expect(page).toHaveURL(/.*dashboard\/admin\/create-category/);
    });

    test("should navigate to create product from menu", async ({ page }) => {
      await page.getByText("Create Product").click();
      await expect(page).toHaveURL(/.*dashboard\/admin\/create-product/);
    });

    test("should navigate to orders from menu", async ({ page }) => {
      await page.getByText("Orders").click();
      await expect(page).toHaveURL(/.*dashboard\/admin\/orders/);
    });

    test("should maintain admin menu functionality across navigation", async ({ page }) => {
      // Navigate away and back to test menu persistence
      await page.getByText("Create Category").click();
      await expect(page).toHaveURL(/.*dashboard\/admin\/create-category/);
      
      // Navigate back to products page
      await page.goto("/dashboard/admin/products");
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
        await page.goto("/dashboard/admin/products");
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
        
        await page.goto("/dashboard/admin/products");
        
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
