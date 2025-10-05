import React from "react";
import { render, screen, act } from "@testing-library/react";
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

  test("renders category dropdown items", () => {
    // Arrange unauthenticated state and empty cart
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    useCart.mockReturnValue([[]]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole("link", { name: /^categories$/i })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: /all categories/i })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: /cat one/i })).toHaveAttribute("href", "/category/cat-one");
    expect(screen.getByRole("link", { name: /cat two/i })).toHaveAttribute("href", "/category/cat-two");
  });

  test("renders brand logo", () => {
    // Arrange unauthenticated state and empty cart
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    useCart.mockReturnValue([[]]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText(/Virtual Vault/i)).toBeInTheDocument();
  });

  test("renders navigation links", () => {
    // Arrange unauthenticated state and empty cart
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    useCart.mockReturnValue([[]]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /^categories$/i })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart");
  });

  test("renders authentication links when unauthenticated", () => {
    // Arrange unauthenticated state and empty cart
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    useCart.mockReturnValue([[]]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole("link", { name: /login/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /register/i })).toHaveAttribute("href", "/register");
  });

  test("does not render authenticated elements when unauthenticated", () => {
    // Arrange unauthenticated state and empty cart
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    useCart.mockReturnValue([[]]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Assert
    expect(screen.queryByRole("link", { name: /dashboard/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /logout/i })).not.toBeInTheDocument();
  });

  test("renders user name when authenticated", () => {
    // Arrange authenticated admin and cart with items
    useAuth.mockReturnValue([{ user: { name: "Alice", role: 1 }, token: "t" }, jest.fn()]);
    useCart.mockReturnValue([[1, 2, 3]]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
  });

  test("renders dashboard and logout links when authenticated", () => {
    // Arrange authenticated admin and cart with items
    useAuth.mockReturnValue([{ user: { name: "Alice", role: 1 }, token: "t" }, jest.fn()]);
    useCart.mockReturnValue([[1, 2, 3]]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard/admin");
    expect(screen.getByRole("link", { name: /logout/i })).toHaveAttribute("href", "/login");
  });

  test("does not render authentication links when authenticated", () => {
    // Arrange authenticated admin and cart with items
    useAuth.mockReturnValue([{ user: { name: "Alice", role: 1 }, token: "t" }, jest.fn()]);
    useCart.mockReturnValue([[1, 2, 3]]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Assert
    expect(screen.queryByRole("link", { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /register/i })).not.toBeInTheDocument();
  });

  test("displays correct cart badge count", () => {
    // Arrange - mock cart with 3 items
    const mockCart = [1, 2, 3];
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    useCart.mockReturnValue([mockCart]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Act
    const cartBadge = screen.getByTitle("3"); // Badge shows count as title

    // Assert
    expect(cartBadge).toBeInTheDocument();
    expect(cartBadge).toHaveTextContent("3");
  });

  test("displays zero cart badge count when cart is empty", () => {
    // Arrange - mock empty cart
    const mockCart = [];
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    useCart.mockReturnValue([mockCart]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Act
    const cartBadge = screen.getByTitle("0"); // Badge shows count as title

    // Assert
    expect(cartBadge).toBeInTheDocument();
    expect(cartBadge).toHaveTextContent("0");
  });

  test("calls handleLogout when logout link is clicked", () => {
    // Arrange - mock authenticated user and setAuth function
    const mockSetAuth = jest.fn();
    useAuth.mockReturnValue([{ user: { name: "Alice", role: 1 }, token: "t" }, mockSetAuth]);
    useCart.mockReturnValue([[]]);

    const localStorageMock = {
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Act
    const logoutLink = screen.getByRole("link", { name: /logout/i });
    
    act(() => {
      logoutLink.click();
    });

    // Assert
    expect(mockSetAuth).toHaveBeenCalledWith({
      user: null,
      token: "",
    });
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("auth");
  });

  test("FSM Test: header elements present after login then logout", () => {
    useCart.mockReturnValue([[]]);

    let authState = { user: null, token: "" };
    const mockSetAuth = (next) => {
      authState = next;
    };
    useAuth.mockImplementation(() => [authState, mockSetAuth]);

    const { rerender } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    //login
    authState = { user: { name: "Alice", role: 1 }, token: "t" };
    rerender(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^categories$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /logout/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /register/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /login/i })).not.toBeInTheDocument();

    // Logout
    const logoutLink = screen.getByRole("link", { name: /logout/i });
    act(() => {
      logoutLink.click();
    });

    rerender(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^categories$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();
    expect(screen.queryByText(/Alice/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /dashboard/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /logout/i })).not.toBeInTheDocument();
  });
});

