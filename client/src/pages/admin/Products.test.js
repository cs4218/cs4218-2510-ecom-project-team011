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

// All renders are async so its a little different, we need to use wrap renders in act and await for assertion
describe("Products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log to avoid noise in tests
  });

  test("renders admin menu", async () => {
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

    expect(await screen.getByTestId("admin-menu")).toBeInTheDocument();
  });

  test("renders products heading", async () => {
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

    expect(await screen.getByText("All Products List")).toBeInTheDocument();
  });

  test("renders product names and descriptions on success", async () => {
    const mockProducts = [
      {
        _id: "1",
        name: "Product 1",
        description: "Description 1",
        slug: "product-1",
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

    expect(await screen.findByText("Product 1")).toBeInTheDocument();
    expect(await screen.findByText("Description 1")).toBeInTheDocument();
  });

  test("renders exactly two product links when two products provided", async () => {
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

    const productLinks = await screen.findAllByRole("link");
    expect(productLinks).toHaveLength(2);
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

    const image = await screen.findByAltText("Test Product");
    expect(image).toHaveAttribute("src", "/api/v1/product/product-photo/123");
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

    expect(await screen.findByText("All Products List")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
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

    await screen.findByText("All Products List");
    expect(console.log).toHaveBeenCalledWith(error);
    expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");

    // shud still render the basic structure
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

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product"));
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

    expect(await screen.findByText("All Products List")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});