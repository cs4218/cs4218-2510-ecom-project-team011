import { test, expect } from "@playwright/test";

test.describe("CategoryProduct Page", () => {
  test("Navigating between related products from categories page", async ({
    page,
  }) => {
    await page.goto("/categories/");
    await page.getByRole("link", { name: "Electronics" }).click();
    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page.getByRole("main")).toContainText("Name : Smartphone");
    await expect(page.getByRole("main")).toContainText(
      "Description : A high-end smartphone"
    );
    await expect(page.getByRole("main")).toContainText("Price :$999.99");
    await expect(page.getByRole("main")).toContainText(
      "Category : Electronics"
    );
    await expect(
      page.getByRole("heading", { name: "Similar Products ➡️" })
    ).toBeVisible();
    await page.getByRole("button", { name: "More Details" }).click();
    await expect(page.getByRole("main")).toContainText("Name : Laptop");
    await expect(page.getByRole("main")).toContainText(
      "Description : A powerful laptop"
    );
    await expect(page.getByRole("main")).toContainText("Price :$1,499.99");
    await expect(page.getByRole("main")).toContainText(
      "Category : Electronics"
    );
  });

  test("Navigating between different categories", async ({ page }) => {
    await page.goto("/categories/");
    await page.getByRole("link", { name: "Electronics" }).click();
    await page.getByRole("button", { name: "More Details" }).first().click();
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "Book" }).click();
    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page.getByRole("main")).toContainText("Name : Textbook");
    await expect(page.getByRole("main")).toContainText(
      "Description : A comprehensive textbook"
    );
    await expect(page.getByRole("main")).toContainText("Price :$79.99");
    await expect(page.getByRole("main")).toContainText("Category : Book");
    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page.getByRole("main")).toContainText("Name : Novel");
    await expect(page.getByRole("main")).toContainText(
      "Description : A bestselling novel"
    );
    await expect(page.getByRole("main")).toContainText("Price :$14.99");
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();
    await expect(page.getByRole("link", { name: "Electronics" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Book" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Clothing" })).toBeVisible();
  });
});
