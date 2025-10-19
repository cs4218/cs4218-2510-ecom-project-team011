import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";

import Header from "./Header";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import { SearchProvider } from "../context/search";

jest.mock("axios");
const mockedAxios = axios;

const TestWrapper = ({ children, initialRoute = "/" }) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    <AuthProvider>
      <CartProvider>
        <SearchProvider>{children}</SearchProvider>
      </CartProvider>
    </AuthProvider>
  </MemoryRouter>
);

describe("Header Integration Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        category: [
          { _id: "1", name: "Electronics", slug: "electronics" },
          { _id: "2", name: "Clothing", slug: "clothing" },
        ],
      },
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Authentication Integration", () => {
    test("should show authenticated user when auth data exists", async () => {
      localStorage.setItem("auth", JSON.stringify({
        user: { name: "John Doe", role: 0, email: "john@test.com" },
        token: "test-token"
      }));

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
      });

      // Should not show login/register links
      expect(screen.queryByRole("link", { name: /login/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /register/i })).not.toBeInTheDocument();
    });

    test("should show login links when no auth data", async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
      });

      expect(screen.queryByText(/John Doe/i)).not.toBeInTheDocument();
    });

    test("should handle logout functionality", async () => {
      localStorage.setItem("auth", JSON.stringify({
        user: { name: "John Doe", role: 0, email: "john@test.com" },
        token: "test-token"
      }));

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Wait for authenticated state
      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      });

      // Click logout
      const logoutLink = screen.getByRole("link", { name: /logout/i });
      fireEvent.click(logoutLink);

      // Should show login links after logout
      await waitFor(() => {
        expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
      });

      expect(screen.queryByText(/John Doe/i)).not.toBeInTheDocument();
      expect(localStorage.getItem("auth")).toBeNull();
    });

    test("should show admin dashboard for admin users", async () => {
      localStorage.setItem("auth", JSON.stringify({
        user: { name: "Admin User", role: 1, email: "admin@test.com" },
        token: "admin-token"
      }));

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
        expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
      });
    });

    test("should show user dashboard for regular users", async () => {
      localStorage.setItem("auth", JSON.stringify({
        user: { name: "Regular User", role: 0, email: "user@test.com" },
        token: "user-token"
      }));

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
        expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
      });
    });
  });

  describe("Cart Integration", () => {
    test("should show cart count when cart has items", async () => {
      localStorage.setItem("cart", JSON.stringify([
        { _id: "1", name: "Item 1", price: 10 },
        { _id: "2", name: "Item 2", price: 20 }
      ]));

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTitle("2")).toBeInTheDocument(); // Cart badge count
      });
    });

    test("should show zero count when cart is empty", async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTitle("0")).toBeInTheDocument();
      });
    });

    test("should maintain cart state across navigation", async () => {
      localStorage.setItem("cart", JSON.stringify([
        { _id: "1", name: "Persistent Item", price: 15 }
      ]));

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTitle("1")).toBeInTheDocument();
      });

      // Navigate to cart page
      const cartLink = screen.getByRole("link", { name: /cart/i });
      fireEvent.click(cartLink);

      // Cart count should persist
      await waitFor(() => {
        expect(screen.getByTitle("1")).toBeInTheDocument();
      });
    });
  });

  describe("Category Integration", () => {
    test("should load categories from API and display in Header", async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Wait for API call
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });

      // Wait for categories to be displayed
      await waitFor(() => {
        expect(screen.getByRole("link", { name: /electronics/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /clothing/i })).toBeInTheDocument();
      });
    });

    test("should handle API errors gracefully", async () => {
      mockedAxios.get.mockRejectedValue(new Error("API Error"));

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });

      // Header should still render properly
      expect(screen.getByRole("link", { name: /categories/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /all categories/i })).toBeInTheDocument();
    });

    test("should display correct category links", async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        const electronicsLink = screen.getByRole("link", { name: /electronics/i });
        const clothingLink = screen.getByRole("link", { name: /clothing/i });

        expect(electronicsLink).toHaveAttribute("href", "/category/electronics");
        expect(clothingLink).toHaveAttribute("href", "/category/clothing");
      });
    });
  });

  describe("Search Integration", () => {
    test("should render search input", async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole("search")).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });
    });

    test("should integrate with SearchProvider context", async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search/i);
        expect(searchInput).toBeInTheDocument();
        
        // Test real input interaction
        fireEvent.change(searchInput, { target: { value: "test search" } });
        expect(searchInput.value).toBe("test search");
      });
    });
  });

  describe("Navigation Integration", () => {
    test("should render all navigation links", async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /virtual vault/i })).toHaveAttribute("href", "/");
        expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
        expect(screen.getByRole("link", { name: /categories/i })).toHaveAttribute("href", "/categories");
        expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart");
      });
    });

    test("should handle navigation between different routes", async () => {
      render(
        <TestWrapper initialRoute="/">
          <Header />
        </TestWrapper>
      );

      // Navigate to categories
      const categoriesLink = screen.getByRole("link", { name: /categories/i });
      fireEvent.click(categoriesLink);

      // Header should persist with navigation
      await waitFor(() => {
        expect(screen.getByRole("link", { name: /virtual vault/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();
      });
    });
  });
});
