/**
 * Integration test for AdminOrders:
 * - Fetches orders
 * - Allows status update
 */
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../utils/test-utils";

import AdminOrders from "AdminOrders.js";

jest.mock("axios");
jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">AdminMenu</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);
jest.mock("moment", () => () => ({ fromNow: () => "a moment ago", format: () => "2025-10-21" }));

describe("AdminOrders (integration)", () => {
  test("lists orders and updates status", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { _id: "o1", status: "Processing", buyer: { name: "Alice" }, payment: { success: true }, products: [{ _id: "p1", name: "Widget" }] }
      ]
    });

    axios.put.mockResolvedValueOnce({ data: { ok: true } });
    axios.get.mockResolvedValueOnce({
      data: [
        { _id: "o1", status: "Shipped", buyer: { name: "Alice" }, payment: { success: true }, products: [{ _id: "p1", name: "Widget" }] }
      ]
    });

    renderWithProviders(<AdminOrders />, { route: "/dashboard/admin/orders", authValue: [{ token: "t" }, jest.fn()] });

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    const statusSelects = screen.getAllByRole("combobox");
    await userEvent.selectOptions(statusSelects[0], "Shipped");

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
  });
});
