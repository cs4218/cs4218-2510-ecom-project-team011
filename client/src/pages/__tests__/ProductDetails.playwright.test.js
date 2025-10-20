import { test, expect } from "@playwright/test";

test.describe("ProductDetails Page", () => {
  test("Navigating between related products from ProductDetails page", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/product/laptop");
    await expect(page.getByRole("main")).toContainText("Name : Laptop");
    await expect(page.getByRole("main")).toContainText(
      "Description : A powerful laptop"
    );
    await expect(page.getByRole("main")).toContainText("Price :$1,499.99");
    await expect(page.getByRole("main")).toContainText(
      "Category : Electronics"
    );
    await expect(
      page.getByRole("heading", { name: "Similar Products ➡️" })
    ).toBeVisible();
    await page.getByRole("button", { name: "More Details" }).click();
    await expect(page.getByRole("main")).toContainText("Name : Smartphone");
    await expect(page.getByRole("main")).toContainText(
      "Description : A high-end smartphone"
    );
    await expect(page.getByRole("main")).toContainText("Price :$999.99");
    await expect(page.getByRole("main")).toContainText(
      "Category : Electronics"
    );
  });

  test("Able to add main product to cart via add to cart button", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/product/laptop");
    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page.getByText("Laptop", { exact: true })).toBeVisible();
    await expect(page.getByRole("main")).toContainText("A powerful laptop");
  });

  test("Able to add related products to cart via add to cart button", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/product/novel");
    await page.getByRole("button", { name: "ADD TO CART" }).nth(1).click();
    await page.getByRole("button", { name: "ADD TO CART" }).nth(2).click();
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page.getByText("Textbook", { exact: true })).toBeVisible();
    await expect(page.getByText("A comprehensive textbook")).toBeVisible();
    await expect(page.getByText("The Law of Contract in")).toBeVisible();
    await expect(
      page.getByText("A bestselling book in Singapor")
    ).toBeVisible();
  });
});
