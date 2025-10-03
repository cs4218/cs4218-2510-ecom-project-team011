import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

// Mock nested components and hooks used by Header
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("../hooks/useCategory", () => ({ __esModule: true, default: jest.fn() }));

jest.mock("./Form/SearchInput", () => () => <div data-testid="search-input" />);

// Suppress toast side effects
jest.mock("react-hot-toast", () => ({ success: jest.fn() }));

import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import useCategory from "../hooks/useCategory";
import Header from "./Header";

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks
    useCategory.mockReturnValue([
      { name: "Cat One", slug: "cat-one" },
      { name: "Cat Two", slug: "cat-two" },
    ]);
  });

  test("renders brand, Home, Register and Login when unauthenticated", () => {
    // Arrange unauthenticated state and empty cart
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    useCart.mockReturnValue([[]]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Brand
    expect(screen.getByText(/Virtual Vault/i)).toBeInTheDocument();

    // Basic nav links
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /register/i })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: /login/i })).toHaveAttribute("href", "/login");

    // Categories dropdown content is rendered (exact match for the toggle link)
    expect(screen.getByRole("link", { name: /^categories$/i })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: /all categories/i })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: /cat one/i })).toHaveAttribute("href", "/category/cat-one");
    expect(screen.getByRole("link", { name: /cat two/i })).toHaveAttribute("href", "/category/cat-two");

    // Cart link present with badge (count may be hidden visually but link exists)
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart");
  });

  test("renders user name and dashboard/logout when authenticated (admin)", () => {
    // Arrange authenticated admin and cart with items
    useAuth.mockReturnValue([{ user: { name: "Alice", role: 1 }, token: "t" }, jest.fn()]);
    useCart.mockReturnValue([[1, 2, 3]]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // User name shown
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();

    // Dashboard link targets admin dashboard
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard/admin");

    // Logout link points to login route
    expect(screen.getByRole("link", { name: /logout/i })).toHaveAttribute("href", "/login");

    // Cart link still present
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart");
  });
});

