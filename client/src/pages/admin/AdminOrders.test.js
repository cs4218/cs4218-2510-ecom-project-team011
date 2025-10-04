import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// ---------- Mocks ----------
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));
import axios from "axios";

// Mock useAuth
jest.mock("../path/to/context/auth", () => ({
  useAuth: () => [{ token: "test-token" }, jest.fn()],
}));

// Mock Layout and AdminMenu
jest.mock("../path/to/components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));
jest.mock("../path/to/components/AdminMenu", () => ({
  __esModule: true,
  default: () => <nav data-testid="admin-menu">AdminMenu</nav>,
}));

// Mock moment
jest.mock("moment", () => {
  return (input) => ({
    fromNow: () => "3 days ago",
  });
});

// Replace antd Select with a simple native <select>
jest.mock("antd", () => {
  const React = require("react");
  const Select = ({ children, defaultValue, onChange, ...rest }) => {
    // Convert children <Option value="...">label</Option> into <option/>
    const options = React.Children.map(children, (child) => {
      if (!child) return null;
      const { value, children: label } = child.props || {};
      return (
        <option key={value} value={value}>
          {label}
        </option>
      );
    });
    return (
      <select
        data-testid="status-select"
        defaultValue={defaultValue}
        onChange={(e) => onChange && onChange(e.target.value)}
        {...rest}
      >
        {options}
      </select>
    );
  };
  const Option = ({ children }) => <>{children}</>;
  return { Select, Option };
});

// ---------- SUT ----------
import AdminOrders from "../path/to/pages/Admin/AdminOrders";

// ---------- Helpers ----------
const fakeOrders = [
  {
    _id: "o1",
    status: "Processing",
    buyer: { name: "Alice" },
    createAt: "2025-09-28T00:00:00.000Z",
    payment: { success: true },
    products: [
      {
        _id: "p1",
        name: "Widget",
        description: "A very useful widget for testing purposes.",
        price: 99,
      },
      {
        _id: "p2",
        name: "Gadget",
        description: "Another product with a longer description for cuts.",
        price: 123,
      },
    ],
  },
  {
    _id: "o2",
    status: "Not Process",
    buyer: { name: "Bob" },
    createAt: "2025-09-25T00:00:00.000Z",
    payment: { success: false },
    products: [
      {
        _id: "p3",
        name: "Thing",
        description: "Thingy description.",
        price: 10,
      },
    ],
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

// ======================================================================
// Fetch & render
// ======================================================================
test("renders orders after fetching when token exists (AAA)", async () => {
  // Arrange
  axios.get.mockResolvedValueOnce({ data: fakeOrders });

  // Act
  render(<AdminOrders />);

  // Assert (layout/menu present)
  expect(screen.getByTestId("layout")).toBeInTheDocument();
  expect(screen.getByTestId("admin-menu")).toBeInTheDocument();

  // Assert (fetch called)
  await waitFor(() =>
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders")
  );

  // Assert (heading)
  expect(screen.getByRole("heading", { name: /All Orders/i })).toBeInTheDocument();

  // Assert (table rows for each order)
  // There is 1 <table> per order block; verify core fields for first order
  const firstBuyer = screen.getByText("Alice");
  const ordersTable = firstBuyer.closest("table");
  const row = within(ordersTable).getByRole("row", { name: /1/i }); // first row shows index i+1
  expect(within(row).getByText("Alice")).toBeInTheDocument();
  expect(within(row).getByText("Success")).toBeInTheDocument();
  expect(within(row).getByText("3 days ago")).toBeInTheDocument();
  expect(within(row).getByText(String(fakeOrders[0].products.length))).toBeInTheDocument();

  // Second order fields
  const secondBuyer = screen.getByText("Bob");
  const ordersTable2 = secondBuyer.closest("table");
  const row2 = within(ordersTable2).getByRole("row", { name: /1/i });
  expect(within(row2).getByText("Failed")).toBeInTheDocument();
  expect(within(row2).getByText(String(fakeOrders[1].products.length))).toBeInTheDocument();

  // Assert (product cards render names/prices/descriptions trimmed)
  expect(screen.getByText("Widget")).toBeInTheDocument();
  expect(screen.getByText("Gadget")).toBeInTheDocument();
  expect(screen.getByText("Price : 99")).toBeInTheDocument();
  expect(screen.getByText("Price : 123")).toBeInTheDocument();

  // description is substring(0, 30); check a prefix exists
  expect(
    screen.getByText(/A very useful widget for test/i)
  ).toBeInTheDocument();
});

// ======================================================================
// Change status -> PUT + refetch
// ======================================================================
test("changing order status calls PUT and refetches (AAA)", async () => {
  // Arrange
  const user = userEvent.setup();
  // initial fetch
  axios.get.mockResolvedValueOnce({ data: fakeOrders });
  // update call
  axios.put.mockResolvedValueOnce({ data: { _id: "o1", status: "Shipped" } });
  // refetch after update
  axios.get.mockResolvedValueOnce({
    data: [{ ...fakeOrders[0], status: "Shipped" }, fakeOrders[1]],
  });

  render(<AdminOrders />);

  // Act: wait initial fetch
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

  // Find the first order's select (there is one select per order)
  const selects = screen.getAllByTestId("status-select");
  // First select should have defaultValue (from mocked select) of "Processing"
  // Change it to "Shipped"
  await user.selectOptions(selects[0], "Shipped");

  // Assert: PUT called with correct args
  await waitFor(() =>
    expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/o1", {
      status: "Shipped",
    })
  );

  // Assert: after PUT, it refetches orders again
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
});

// ======================================================================
// Error path: GET fails (we log; component should not crash)
// ======================================================================
test("handles fetch failure gracefully (AAA)", async () => {
  // Arrange
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  axios.get.mockRejectedValueOnce(new Error("network down"));

  // Act
  render(<AdminOrders />);

  // Assert: logged, but test should not crash
  await waitFor(() => expect(axios.get).toHaveBeenCalled());
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});
