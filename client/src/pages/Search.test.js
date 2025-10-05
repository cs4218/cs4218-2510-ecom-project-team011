import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Search from "./Search";
import { useSearch } from "../context/search";

// Mock Layout component
jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="layout">
      <h1 data-testid="page-title">{title}</h1>
      {children}
    </div>
  ),
}));

// Mock search context
const mockSetValues = jest.fn();
jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

describe("Search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSearch.mockReturnValue([{ keyword: '', results: [] }, mockSetValues]);
  });

  test("renders search page with title", () => {
    // Act
    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByTestId("page-title")).toHaveTextContent("Search results");
  });

  test("displays 'No Products Found' when results array is empty", () => {
    // Act
    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  test("displays 'Found X' when results array has items", () => {
    // Arrange
    useSearch.mockReturnValue([
      {
        keyword: '', //keyword is useless here, not used in Search component, can be any value
        results: [
          { _id: "1", name: "Product 1", description: "Description 1", price: 100 },
          { _id: "2", name: "Product 2", description: "Description 2", price: 200 },
        ],
      },
      mockSetValues,
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText("Found 2")).toBeInTheDocument();
  });

  test("renders one product card for one result", () => {
    useSearch.mockReturnValue([
      {
        results: [
          {
            _id: "1",
            name: "Test Product",
            description: "This is a test product description",
            price: 99.99,
          },
        ],
      },
      mockSetValues,
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Assert
    const cards = document.querySelectorAll('.card');
    expect(cards.length).toBe(1);
  });

  test("renders searched cards text correctly", () => {
    // Arrange
    useSearch.mockReturnValue([
      {
        results: [
          {
            _id: "1",
            name: "Test Product",
            description: "This is a test product description",
            price: 99.99,
          },
        ],
      },
      mockSetValues,
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText(/This is a test product desc/)).toBeInTheDocument();
    expect(screen.getByText("$ 99.99")).toBeInTheDocument();
  });

  test("renders searched cards with correct buttons", () => {
    // Arrange
    useSearch.mockReturnValue([
      {
        results: [
          {
            _id: "1",
            name: "Test Product",
            description: "This is a test product description",
            price: 99.99,
          },
        ],
      },
      mockSetValues,
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText("More Details")).toBeInTheDocument();
    expect(screen.getByText("ADD TO CART")).toBeInTheDocument();
  });

  test("correctlytruncates long descriptions to 30 characters", () => {
    // Arrange
    useSearch.mockReturnValue([
      {
        results: [
          {
            _id: "1",
            name: "Test Product",
            description: "This is a very long description that should be truncated",
            price: 99.99,
          },
        ],
      },
      mockSetValues,
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByText(/This is a very long desc/)).toBeInTheDocument();
  });

  test("displays product images with correct src", () => {
    useSearch.mockReturnValue([
      {
        results: [
          {
            _id: "123",
            name: "Test Product",
            description: "Test description",
            price: 99.99,
          },
        ],
      },
      mockSetValues,
    ]);

    render(
      <MemoryRouter>
        <Search />
      </MemoryRouter>
    );

    // Assert
    const image = screen.getByAltText("Test Product");
    expect(image).toHaveAttribute("src", "/api/v1/product/product-photo/123");
  });
});