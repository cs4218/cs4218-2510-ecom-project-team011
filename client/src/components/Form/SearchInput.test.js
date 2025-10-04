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

  test("renders search form with input and button", () => {
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  test("displays current keyword value from context", () => {
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Search");
    expect(input).toHaveValue("test search");
  });

  test("updates keyword when input changes", () => {
    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Search");
    fireEvent.change(input, { target: { value: "new search term" } });

    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: "new search term",
      results: [],
    });
  });

  test("submits form and navigates on successful search", async () => {
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

    const form = screen.getByRole("search");
    fireEvent.submit(form);

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
    const error = new Error("API Error");
    axios.get.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const form = screen.getByRole("search");
    fireEvent.submit(form);

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
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <SearchInput />
      </MemoryRouter>
    );

    const form = screen.getByRole("search");
    fireEvent.submit(form);

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
