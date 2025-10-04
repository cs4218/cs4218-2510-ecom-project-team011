// Orders.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Orders from "./Orders";
import axios from "axios";
import { useAuth } from "../../context/auth";

// mock axios
jest.mock("axios");

// mock useAuth
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

// mock Layout and UserMenu so we don’t depend on their internals
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));
jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="usermenu">User Menu</div>
));

describe("Orders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders orders when API returns data", async () => {
    // fake orders
    const fakeOrders = [
      {
        _id: "order1",
        status: "Shipped",
        buyer: { name: "CJ" },
        createAt: "2025-09-20T12:00:00Z",
        payment: { success: true },
        products: [
          {
            _id: "p1",
            name: "Sample Product",
            description: "This is a test description",
            price: 100,
          },
        ],
      },
    ];

    // mock hooks and axios
    useAuth.mockReturnValue([{ token: "fake-token" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: fakeOrders });

    render(<Orders />);

    // wait for API data to render
    await waitFor(() =>
      expect(screen.getByText(/Price/i)).toBeInTheDocument()
    );

    // verify order details show
    expect(screen.getByText("Shipped")).toBeInTheDocument();
    expect(screen.getByText("CJ")).toBeInTheDocument();
    expect(screen.getByText(/Success/)).toBeInTheDocument();
    expect(screen.getByText(/Sample Product/)).toBeInTheDocument();
  });

  it("does not fetch if no auth token", async () => {
    useAuth.mockReturnValue([{}, jest.fn()]);

    render(<Orders />);

    expect(axios.get).not.toHaveBeenCalled();
  });
  it("handles axios failure (e.g., no internet connection)", async () => {
    // Arrange: mock auth with token so getOrders runs
    useAuth.mockReturnValue([{ token: "fake-token" }, jest.fn()]);

    // Mock axios to throw a network error
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    // Spy on console.log to capture the error
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    render(<Orders />);

    // Wait for the effect to run and fail
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    // Assert that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

    // Cleanup spy
    consoleSpy.mockRestore();
  });

});
