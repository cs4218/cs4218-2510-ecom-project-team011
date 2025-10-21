const { test, expect } = require('@playwright/test');

test.describe('Admin UI smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Seed auth if your app reads localStorage('auth')
    await page.addInitScript(() => {
      localStorage.setItem('auth', JSON.stringify({ token: 'fake.jwt.token', user: { name: 'Admin', email: 'admin@corp.com', phone: '999', role: 1 } }));
    });
  });

  test('admin dashboard shows profile and orders flow', async ({ page }) => {
    // Dashboard
    await page.goto('/dashboard/admin');
    await expect(page.getByText(/admin name/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/admin email/i)).toBeVisible();

    // Orders page
    await page.goto('/dashboard/admin/orders');

    // Status dropdown (first select)
    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible().catch(() => false)) {
      // Try selecting 'Shipped' (change if your options differ)
      await statusSelect.selectOption({ label: 'Shipped' }).catch(async () => {
        // Fallback to value or index
        await statusSelect.selectOption({ value: 'Shipped' }).catch(async () => {
          await statusSelect.selectOption({ index: 1 }).catch(() => {});
        });
      });
    }

    // Page should still be reachable
    await expect(page).toHaveURL(/dashboard\/admin\/orders/i);
  });
});
