import { test, expect } from "@playwright/test";

test.describe("CategoryProduct Page", () => {
  test("Navigating between different categories", async ({ page }) => {
    await page.goto("http://localhost:3000/categories");
    await page.getByRole("link", { name: "Electronics" }).click();
    await page.getByRole("button", { name: "More Details" }).first().click();
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "Book" }).click();
    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page.getByRole("main")).toContainText("Name : Novel");
    await expect(page.getByRole("main")).toContainText(
      "Description : A bestselling novel"
    );
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "Clothing" }).click();
    await page.getByRole("button", { name: "More Details" }).click();
    await expect(page.getByRole("main")).toContainText("Name : NUS T-shirt");
    await expect(page.getByRole("main")).toContainText(
      "Description : Plain NUS T-shirt for sale"
    );
  });

  test("Able to add to cart from product category page", async ({ page }) => {
    await page.goto("/categories");
    await page.getByRole("link", { name: "Electronics" }).click();
    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page.getByText("Laptop", { exact: true })).toBeVisible();
    await expect(page.getByText("A powerful laptop")).toBeVisible();
    await expect(page.getByText("Price :")).toBeVisible();
  });

});
