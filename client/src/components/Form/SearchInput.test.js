import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import SearchInput from "./SearchInput";

// Mock dependencies
jest.mock("axios");

// Mock search context
const mockSetValues = jest.fn();
const mockNavigate = jest.fn();

jest.mock("../../context/search", () => ({
  useSearch: () => [
    { keyword: "test search", results: [] },
    mockSetValues,
  ],
}));

// Mock useNavigate
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("SearchInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log to avoid noise in tests
  });

  test("renders search form", () => {
    // Arrange
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    // Act & Assert
    expect(screen.getByRole("search")).toBeInTheDocument();
  });

  test("renders search input field", () => {
    // Arrange
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    // Act & Assert
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  test("renders search button", () => {
    // Arrange
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    // Act & Assert
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  test("input has correct placeholder attribute", () => {
    // Arrange
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    // Act
    const input = screen.getByPlaceholderText("Search");
    
    // Assert
    expect(input).toHaveAttribute("placeholder", "Search");
  });

  test("input has correct aria-label attribute", () => {
    // Arrange
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    // Act
    const input = screen.getByLabelText("Search");
    
    // Assert
    expect(input).toHaveAttribute("aria-label", "Search");
  });

  test("displays current keyword value from context", () => {
    // Arrange
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    // Act
    const input = screen.getByPlaceholderText("Search");
    
    // Assert
    expect(input).toHaveValue("test search");
  });

  test("updates keyword when input changes", () => {
    // Arrange
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    // Act
    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "new search term" } });

    // Assert
    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: "new search term",
      results: [],
    });
  });

  test("submits form and navigates on successful search", async () => {
    // Arrange
    const mockSearchResults = [
      { id: 1, name: "Product 1" },
      { id: 2, name: "Product 2" },
    ];
    axios.get.mockResolvedValueOnce({ data: mockSearchResults });

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    // Act
    const form = screen.getByRole("search");
    fireEvent.submit(form);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/search/test search"
      );
    });

    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: "test search",
      results: mockSearchResults,
    });
    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });

  test("handles API error gracefully", async () => {
    // Arrange
    const error = new Error("API Error");
    axios.get.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    // Act
    const form = screen.getByRole("search");
    fireEvent.submit(form);

    // Assert
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(error);
    });

    // Should not update values or navigate on error
    expect(mockSetValues).not.toHaveBeenCalledWith(
      expect.objectContaining({ results: expect.any(Array) })
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("form submission triggers search with current keyword", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    // Act
    const form = screen.getByRole("search");
    fireEvent.submit(form);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/search/test search"
      );
    });

    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: "test search",
      results: [],
    });
    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });
});
