import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import AdminMenu from "./AdminMenu";

describe("AdminMenu", () => {
  test("renders heading and all links with correct routes", async () => {
    // Arrange
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();

    const createCategory = screen.getByRole("link", { name: /create category/i });
    const createProduct  = screen.getByRole("link", { name: /create product/i });
    const products       = screen.getByRole("link", { name: /products/i });
    const orders         = screen.getByRole("link", { name: /orders/i });

    expect(createCategory).toHaveAttribute("href", "/dashboard/admin/create-category");
    expect(createProduct).toHaveAttribute("href", "/dashboard/admin/create-product");
    expect(products).toHaveAttribute("href", "/dashboard/admin/products");
    expect(orders).toHaveAttribute("href", "/dashboard/admin/orders");
  });

  test("clicking a link is a client-side nav link", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AdminMenu />
      </MemoryRouter>
    );

    // Act
    await user.click(screen.getByRole("link", { name: /products/i }));

    // Assert
    // With MemoryRouter we can't read the history directly here,
    // but we can at least assert it's an anchor pointing at the route.
    expect(screen.getByRole("link", { name: /products/i }))
      .toHaveAttribute("href", "/dashboard/admin/products");
  });

  test("does not render Users link because it is commented out", () => {
    // Arrange
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    // Assert
    expect(screen.queryByRole("link", { name: /users/i })).not.toBeInTheDocument();
  });
});
