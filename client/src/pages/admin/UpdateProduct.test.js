import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

global.URL.createObjectURL = jest.fn(() => "blob:preview");
class MockFormData {
  constructor() { this._data = []; }
  append(k, v) { this._data.push([k, v]); }
}
global.FormData = MockFormData;

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));
import axios from "axios";

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  success: jest.fn(),
  error: jest.fn(),
}));
import toast from "react-hot-toast";

// Stub Layout/AdminMenu
jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));
jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <nav data-testid="admin-menu">AdminMenu</nav>,
}));

// Replace antd Select
jest.mock("antd", () => {
  const React = require("react");
  const Select = ({ children, value, defaultValue, onChange, ...rest }) => {
    const options = React.Children.map(children, (child) => {
      if (!child) return null;
      const { value, children: label } = child.props || {};
      return <option key={value} value={value}>{label}</option>;
    });
    return (
      <select
        data-testid="antd-select"
        value={value ?? defaultValue}
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

// Router: params + navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: "nice-slug" }),
}));

import UpdateProduct from "./UpdateProduct"; 

const productPayload = {
  data: {
    product: {
      _id: "p123",
      name: "Old Phone",
      description: "Old desc",
      price: 111,
      quantity: 9,
      shipping: 1,
      category: { _id: "c2", name: "Books" },
    },
  },
};
const categoriesPayload = {
  data: { success: true, category: [
    { _id: "c1", name: "Electronics" },
    { _id: "c2", name: "Books" },
  ] },
};

beforeEach(() => {
  jest.clearAllMocks();
});

// TEST #1
test("loads product by slug and categories on mount", async () => {
  axios.get
    .mockResolvedValueOnce(productPayload)   // get-product
    .mockResolvedValueOnce(categoriesPayload); // get-category

  render(<UpdateProduct />);

  await waitFor(() => {
    expect(axios.get).toHaveBeenNthCalledWith(1, "/api/v1/product/get-product/nice-slug");
  });
  await waitFor(() => {
    expect(axios.get).toHaveBeenNthCalledWith(2, "/api/v1/category/get-category");
  });

  // Prefilled inputs
  expect(screen.getByDisplayValue("Old Phone")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Old desc")).toBeInTheDocument();
  expect(screen.getByDisplayValue("111")).toBeInTheDocument();
  expect(screen.getByDisplayValue("9")).toBeInTheDocument();

  // Category select shows options
  expect(screen.getByText("Electronics")).toBeInTheDocument();
  expect(screen.getByText("Books")).toBeInTheDocument();
  const selects = screen.getAllByTestId("antd-select");
  expect(selects[0]).toHaveValue("c2"); // value={category}

  // Shipping select shows some value
  expect(selects[1].value).toBe("yes");
});


// TEST #2
test("updates product (with photo): builds FormData and calls PUT", async () => {
  const user = userEvent.setup();
  axios.get
    .mockResolvedValueOnce(productPayload)
    .mockResolvedValueOnce(categoriesPayload);
  // Return shape the component expects (no await): directly return {data:{...}}
  axios.put.mockReturnValue({ data: { success: true, message: "OK" } });

  render(<UpdateProduct />);
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

  // Change name & description
  const nameInput = screen.getByDisplayValue("Old Phone");
  const descInput = screen.getByDisplayValue("Old desc");
  await user.clear(nameInput); await user.type(nameInput, "New Phone");
  await user.clear(descInput); await user.type(descInput, "New desc");

  // Upload photo
  const file = new File(["img"], "new.png", { type: "image/png" });
  const uploadLabel = screen.getByText(/upload photo/i).closest("label");
  const fileInput = uploadLabel.querySelector("input[type=file]");
  await user.upload(fileInput, file);

  // Select new category
  const selects = screen.getAllByTestId("antd-select");
  await user.selectOptions(selects[0], "c1");

  // Click UPDATE
  await user.click(screen.getByRole("button", { name: /update product/i }));

  expect(axios.put).toHaveBeenCalledWith(
    "/api/v1/product/update-product/p123",
    expect.any(FormData)
  );
  const sentFD = axios.put.mock.calls[0][1];
  expect(sentFD._data).toEqual(expect.arrayContaining([
    ["name", "New Phone"],
    ["description", "New desc"],
    ["price", "111"],
    ["quantity", "9"],
    ["photo", file],         // photo included when selected
    ["category", "c1"],
  ]));

  expect(toast.error).toHaveBeenCalledWith("OK");
  expect(toast.success).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalled();
});

// TEST #3
test("navigates on falsy success branch per current code", async () => {
  const user = userEvent.setup();
  axios.get
    .mockResolvedValueOnce(productPayload)
    .mockResolvedValueOnce(categoriesPayload);
  axios.put.mockReturnValue({ data: { success: false, message: "Any" } });

  render(<UpdateProduct />);
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

  // Minimal change and submit
  await user.click(screen.getByRole("button", { name: /update product/i }));

  await waitFor(() =>
    expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully")
  );
  expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
});

// TEST #4
test("deletes product when confirmed", async () => {
  axios.get
    .mockResolvedValueOnce(productPayload)
    .mockResolvedValueOnce(categoriesPayload);
  axios.delete.mockResolvedValueOnce({ data: { success: true } });

  const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("yes");

  render(<UpdateProduct />);
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

  await userEvent.click(screen.getByRole("button", { name: /delete product/i }));

  expect(axios.delete).toHaveBeenCalledWith("/api/v1/product/delete-product/p123");
  expect(toast.success).toHaveBeenCalledWith("Product DEleted Succfully");
  expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  promptSpy.mockRestore();
});

// TEST #5
test("does not delete when prompt canceled", async () => {
  axios.get
    .mockResolvedValueOnce(productPayload)
    .mockResolvedValueOnce(categoriesPayload);

  const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("");

  render(<UpdateProduct />);
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

  await userEvent.click(screen.getByRole("button", { name: /delete product/i }));

  expect(axios.delete).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalled();
  promptSpy.mockRestore();
});

// TEST #6
test("shows toast when categories fetch fails", async () => {
  const clog = jest.spyOn(console, "log").mockImplementation(() => {});
  axios.get
    .mockResolvedValueOnce(productPayload)
    .mockRejectedValueOnce(new Error("down"));

  render(<UpdateProduct />);

  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  expect(toast.error).toHaveBeenCalledWith("Something wwent wrong in getting catgeory");
  clog.mockRestore();
});

// TEST #7
test("shows toast when update throws", async () => {
  axios.get
    .mockResolvedValueOnce(productPayload)
    .mockResolvedValueOnce(categoriesPayload);
  axios.put.mockImplementation(() => { throw new Error("fail"); });

  render(<UpdateProduct />);
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

  await userEvent.click(screen.getByRole("button", { name: /update product/i }));

  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith("something went wrong")
  );
});
