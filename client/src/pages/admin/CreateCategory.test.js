import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));
import axios from "axios";

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { }, // not used directly
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

// Stub CategoryForm
jest.mock("../../components/Form/CategoryForm", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ value, setValue, handleSubmit, "data-testid": dtid = "category-form" }) => (
      <form onSubmit={handleSubmit} data-testid={dtid}>
        <input
          aria-label="category-name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    ),
  };
});

// Mock antd Modal
jest.mock("antd", () => ({
  Modal: ({ visible, children, onCancel }) =>
    visible ? (
      <div data-testid="modal">
        <button onClick={onCancel}>X</button>
        {children}
      </div>
    ) : null,
}));

import CreateCategory from "./CreateCategory"; 

const listPayload = (items) => ({ data: { success: true, category: items } });
const seedCategories = [
  { _id: "c1", name: "Electronics" },
  { _id: "c2", name: "Books" },
];

beforeEach(() => {
  jest.clearAllMocks();
});

// TEST #1
test("fetches categories on mount and renders rows", async () => {
  axios.get.mockResolvedValueOnce(listPayload(seedCategories));

  render(<CreateCategory />);

  await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"));
  // Names in table
  expect(screen.getByText("Electronics")).toBeInTheDocument();
  expect(screen.getByText("Books")).toBeInTheDocument();
  // Layout/AdminMenu present
  expect(screen.getByTestId("layout")).toBeInTheDocument();
  expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
});

// TEST #2
test("creates a category and refetches the list", async () => {

  const user = userEvent.setup();

  axios.get.mockResolvedValueOnce(listPayload(seedCategories));
  // POST /create-category
  axios.post.mockResolvedValueOnce({ data: { success: true } });
  // refetch after create
  const afterCreate = [...seedCategories, { _id: "c3", name: "Toys" }];
  axios.get.mockResolvedValueOnce(listPayload(afterCreate));

  render(<CreateCategory />);

  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
  await user.type(screen.getByLabelText("category-name"), "Toys");
  await user.click(screen.getByRole("button", { name: /submit/i }));

  await waitFor(() =>
    expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "Toys" })
  );
  // Success toast and refetch
  expect(toast.success).toHaveBeenCalledWith("Toys is created");
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  // New item appears
  expect(screen.getByText("Toys")).toBeInTheDocument();
});

// TEST #3
test("shows error toast when create returns success:false", async () => {
  const user = userEvent.setup();
  axios.get.mockResolvedValueOnce(listPayload(seedCategories));
  axios.post.mockResolvedValueOnce({ data: { success: false, message: "Duplicate" } });

  render(<CreateCategory />);
  await waitFor(() => expect(axios.get).toHaveBeenCalled());

  await user.type(screen.getByLabelText("category-name"), "Electronics");
  await user.click(screen.getByRole("button", { name: /submit/i }));

  await waitFor(() => expect(axios.post).toHaveBeenCalled());
  expect(toast.error).toHaveBeenCalledWith("Duplicate");
});

//TEST #4
test("shows generic error toast on create network failure", async () => {
  const user = userEvent.setup();
  const clog = jest.spyOn(console, "log").mockImplementation(() => {});
  axios.get.mockResolvedValueOnce(listPayload(seedCategories));
  axios.post.mockRejectedValueOnce(new Error("down"));

  render(<CreateCategory />);
  await waitFor(() => expect(axios.get).toHaveBeenCalled());

  await user.type(screen.getByLabelText("category-name"), "Garden");
  await user.click(screen.getByRole("button", { name: /submit/i }));

  await waitFor(() => expect(axios.post).toHaveBeenCalled());
  expect(toast.error).toHaveBeenCalledWith("somthing went wrong in input form");
  clog.mockRestore();
});

// TEST #5
test("updates a category name via modal and refetches", async () => {
  const user = userEvent.setup();
  // initial fetch
  axios.get.mockResolvedValueOnce(listPayload(seedCategories));
  // PUT update
  axios.put.mockResolvedValueOnce({ data: { success: true } });
  // refetch after update
  axios.get.mockResolvedValueOnce(
    listPayload([{ _id: "c1", name: "Electronics & Gadgets" }, seedCategories[1]])
  );
  render(<CreateCategory />);

  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
  const editButtons = screen.getAllByRole("button", { name: /edit/i });
  await user.click(editButtons[0]);

  expect(screen.getByTestId("modal")).toBeInTheDocument();
  const updateInput = screen.getByLabelText("category-name");
  await user.clear(updateInput);
  await user.type(updateInput, "Electronics & Gadgets");
  await user.click(screen.getByRole("button", { name: /submit/i }));

  await waitFor(() =>
    expect(axios.put).toHaveBeenCalledWith(
      "/api/v1/category/update-category/c1",
      { name: "Electronics & Gadgets" }
    )
  );
  expect(toast.success).toHaveBeenCalledWith("Electronics & Gadgets is updated");

  // Modal should close 
  await waitFor(() => expect(screen.queryByTestId("modal")).not.toBeInTheDocument());

  // Refetch occurred
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  expect(screen.getByText("Electronics & Gadgets")).toBeInTheDocument();
});

// TEST #6
test("deletes a category and refetches", async () => {
  const user = userEvent.setup();
  axios.get.mockResolvedValueOnce(listPayload(seedCategories));
  axios.delete.mockResolvedValueOnce({ data: { success: true } });
  axios.get.mockResolvedValueOnce(listPayload([{ _id: "c2", name: "Books" }]));

  render(<CreateCategory />);
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

  const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
  await user.click(deleteButtons[0]);

  await waitFor(() =>
    expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/c1")
  );
  expect(toast.success).toHaveBeenCalledWith("category is deleted");
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
});

// TEST #7
test("shows error toast when initial fetch fails (AAA)", async () => {
  const err = new Error("boom");
  const clog = jest.spyOn(console, "log").mockImplementation(() => {});
  axios.get.mockRejectedValueOnce(err);

  render(<CreateCategory />);

  await waitFor(() => expect(axios.get).toHaveBeenCalled());
  expect(toast.error).toHaveBeenCalledWith("Something wwent wrong in getting catgeory");
  clog.mockRestore();
});
