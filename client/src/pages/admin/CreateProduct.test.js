import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

global.URL.createObjectURL = jest.fn(() => "blob:preview");

// Capture FormData keys/values
class MockFormData {
  constructor() { this._data = []; }
  append(k, v) { this._data.push([k, v]); }
}
global.FormData = MockFormData;

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));
import axios from "axios";

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  success: jest.fn(),
  error: jest.fn(),
}));
import toast from "react-hot-toast";

// Minimal stubs for layout/menu
jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));
jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <nav data-testid="admin-menu">AdminMenu</nav>,
}));

// Replace antd
jest.mock("antd", () => {
  const React = require("react");
  const Select = ({ children, defaultValue, onChange, ...rest }) => {
    const options = React.Children.map(children, (child) => {
      if (!child) return null;
      const { value, children: label } = child.props || {};
      return <option key={value} value={value}>{label}</option>;
    });
    return (
      <select
        data-testid="antd-select"
        defaultValue={defaultValue}
        onChange={e => onChange && onChange(e.target.value)}
        {...rest}
      >
        {options}
      </select>
    );
  };
  const Option = ({ children }) => <>{children}</>;
  return { Select, Option };
});

// Mock router navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
}));

import CreateProduct from "./CreateProduct";

const categories = [
  { _id: "c1", name: "Electronics" },
  { _id: "c2", name: "Books" },
];
const listPayload = { data: { success: true, category: categories } };

beforeEach(() => {
  jest.clearAllMocks();
});

// TEST #1
test("fetches categories on mount and shows them in Select", async () => {
  axios.get.mockResolvedValueOnce(listPayload);

  render(<CreateProduct />);

  await waitFor(() =>
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
  );
  // Options appear as text
  expect(screen.getByText("Electronics")).toBeInTheDocument();
  expect(screen.getByText("Books")).toBeInTheDocument();
  expect(screen.getByTestId("layout")).toBeInTheDocument();
  expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
});

// TEST #2
test("creates product: builds FormData and posts to /create-product", async () => {
  const user = userEvent.setup();
  axios.get.mockResolvedValueOnce(listPayload);

  axios.post.mockReturnValue({ data: { success: true, message: "Server says OK" } });

  render(<CreateProduct />);
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

  // Select category
  const selects = screen.getAllByTestId("antd-select");
  await user.selectOptions(selects[0], "c1");

  // Upload photo
  const file = new File(["image-bytes"], "photo.png", { type: "image/png" });
  const uploadLabel = screen.getByText(/upload photo/i).closest("label");
  const hiddenInput = uploadLabel.querySelector("input[type=file]");
  await user.upload(hiddenInput, file);

  // Fill the form fields
  const inputs = screen.getAllByRole("textbox");
  await user.type(inputs[0], "Phone");
  await user.type(inputs[1], "Great phone!");

  const priceInput = screen.getByPlaceholderText(/write a Price/i);
  const qtyInput = screen.getByPlaceholderText(/write a quantity/i);
  await user.clear(priceInput); await user.type(priceInput, "999");
  await user.clear(qtyInput); await user.type(qtyInput, "5");

  // Select shipping
  await user.selectOptions(selects[1], "1"); // Yes

  await user.click(screen.getByRole("button", { name: /create product/i }));

  expect(axios.post).toHaveBeenCalledWith(
    "/api/v1/product/create-product",
    expect.any(FormData)
  );

  const sentFD = axios.post.mock.calls[0][1];

  expect(sentFD._data).toEqual(
    expect.arrayContaining([
      ["name", "Phone"],
      ["description", "Great phone!"],
      ["price", "999"],
      ["quantity", "5"],
      ["photo", file],
      ["category", "c1"],
    ])
  );

  expect(toast.error).toHaveBeenCalledWith("Server says OK");
  // No navigate on this branch
  expect(mockNavigate).not.toHaveBeenCalled();
});

// TEST #3
test("navigates on falsy success branch per current code", async () => {
  const user = userEvent.setup();
  axios.get.mockResolvedValueOnce(listPayload);
  axios.post.mockReturnValue({ data: { success: false, message: "Any" } });

  render(<CreateProduct />);
  await waitFor(() => expect(axios.get).toHaveBeenCalled());

  // Minimal inputs
  const selects = screen.getAllByTestId("antd-select");
  await user.selectOptions(selects[0], "c2");
  await user.type(screen.getAllByRole("textbox")[0], "Book");
  await user.type(screen.getAllByRole("textbox")[1], "Nice book");
  await user.type(screen.getByPlaceholderText(/write a Price/i), "10");
  await user.type(screen.getByPlaceholderText(/write a quantity/i), "3");
  await user.selectOptions(selects[1], "0");

  await user.click(screen.getByRole("button", { name: /create product/i }));

  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith("Product Created Successfully")
  );
  expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
});

// TEST #4
test("shows toast on category fetch failure", async () => {
  const clog = jest.spyOn(console, "log").mockImplementation(() => {});
  axios.get.mockRejectedValueOnce(new Error("network"));

  render(<CreateProduct />);

  await waitFor(() => expect(axios.get).toHaveBeenCalled());
  expect(toast.error).toHaveBeenCalledWith("Something wwent wrong in getting catgeory");
  clog.mockRestore();
});

// TEST #5
test("shows toast on create failure", async () => {
  const user = userEvent.setup();
  axios.get.mockResolvedValueOnce(listPayload);
  axios.post.mockImplementation(() => { throw new Error("down"); });

  render(<CreateProduct />);
  await waitFor(() => expect(axios.get).toHaveBeenCalled());

  // Provide minimal valid inputs
  const selects = screen.getAllByTestId("antd-select");
  await user.selectOptions(selects[0], "c1");
  await user.type(screen.getAllByRole("textbox")[0], "Phone");
  await user.type(screen.getAllByRole("textbox")[1], "Desc");
  await user.type(screen.getByPlaceholderText(/write a Price/i), "1");
  await user.type(screen.getByPlaceholderText(/write a quantity/i), "1");
  await user.selectOptions(selects[1], "1");

  await user.click(screen.getByRole("button", { name: /create product/i }));

  await waitFor(() => expect(toast.error).toHaveBeenCalledWith("something went wrong"));
});
