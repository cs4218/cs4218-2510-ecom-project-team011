import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "@testing-library/jest-dom";
import Products from "./Products";

// Mock dependencies
jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
}));

// Mock Layout and AdminMenu components
jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="admin-menu">Admin Menu</div>,
}));

describe("Products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log to avoid noise in tests
  });

  test("renders admin menu and products heading", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [] },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    expect(screen.getByText("All Products List")).toBeInTheDocument();
  });

  test("displays products when API call succeeds", async () => {
    const mockProducts = [
      {
        _id: "1",
        name: "Product 1",
        description: "Description 1",
        slug: "product-1",
      },
      {
        _id: "2",
        name: "Product 2",
        description: "Description 2",
        slug: "product-2",
      },
    ];

    axios.get.mockResolvedValueOnce({
      data: { products: mockProducts },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
      expect(screen.getByText("Description 1")).toBeInTheDocument();
      expect(screen.getByText("Description 2")).toBeInTheDocument();
    });

    // Check that products are wrapped in links
    const productLinks = screen.getAllByRole("link");
    expect(productLinks).toHaveLength(2);
    expect(productLinks[0]).toHaveAttribute("href", "/dashboard/admin/product/product-1");
    expect(productLinks[1]).toHaveAttribute("href", "/dashboard/admin/product/product-2");
  });

  test("displays product images with correct src", async () => {
    const mockProducts = [
      {
        _id: "123",
        name: "Test Product",
        description: "Test Description",
        slug: "test-product",
      },
    ];

    axios.get.mockResolvedValueOnce({
      data: { products: mockProducts },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      const image = screen.getByAltText("Test Product");
      expect(image).toHaveAttribute("src", "/api/v1/product/product-photo/123");
    });
  });

  test("handles empty products list", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [] },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("All Products List")).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  test("handles API error gracefully", async () => {
    const error = new Error("API Error");
    axios.get.mockRejectedValueOnce(error);

    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(error);
      expect(toast.error).toHaveBeenCalledWith("Someething Went Wrong");
    });

    // Should still render the basic structure
    expect(screen.getByText("All Products List")).toBeInTheDocument();
  });

  test("calls API on component mount", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [] },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
    });
  });

  test("renders multiple products correctly", async () => {
    const mockProducts = [
      {
        _id: "1",
        name: "Product 1",
        description: "Description 1",
        slug: "product-1",
      },
      {
        _id: "2",
        name: "Product 2",
        description: "Description 2",
        slug: "product-2",
      },
      {
        _id: "3",
        name: "Product 3",
        description: "Description 3",
        slug: "product-3",
      },
    ];

    axios.get.mockResolvedValueOnce({
      data: { products: mockProducts },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
      expect(screen.getByText("Product 3")).toBeInTheDocument();
      
      const productLinks = screen.getAllByRole("link");
      expect(productLinks).toHaveLength(3);
    });
  });

  test("handles undefined products gracefully", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: undefined },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("All Products List")).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });
});