/**
 * Integration test for AdminDashboard:
 * - Shows admin details from useAuth()
 */
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../utils/test-utils";

import AdminDashboard from "AdminDashboard.js";

jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">AdminMenu</div>);
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);

describe("AdminDashboard (integration)", () => {
  test("renders admin info", () => {
    const authState = [{ user: { name: "Admin Jane", email: "admin@corp.com", phone: "555-111" } }, jest.fn()];
    renderWithProviders(<AdminDashboard />, { route: "/dashboard/admin", authValue: authState });

    expect(screen.getByText(/Admin Name/i)).toHaveTextContent("Admin Jane");
    expect(screen.getByText(/Admin Email/i)).toHaveTextContent("admin@corp.com");
    expect(screen.getByText(/Admin Contact/i)).toHaveTextContent("555-111");
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
  });
});
