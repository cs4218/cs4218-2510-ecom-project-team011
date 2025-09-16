import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboard from "AdminDashboard.js"; 

// Mock Layout
jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

// Mock AdminMenu
jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <nav data-testid="admin-menu">menu</nav>,
}));

// Mock useAuth
jest.mock("../../context/auth", () => ({
  useAuth: () => [
    {
      user: { name: "Alice Admin", email: "alice@site.com", phone: "12345678" },
    },
  ],
}));

describe("AdminDashboard", () => {
  test("renders AdminMenu and admin details from useAuth", () => {
    // Arrange
    render(<AdminDashboard />);

    // Assert
    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();

    expect(screen.getByText(/Admin Name/i)).toHaveTextContent("Alice Admin");
    expect(screen.getByText(/Admin Email/i)).toHaveTextContent("alice@site.com");
    expect(screen.getByText(/Admin Contact/i)).toHaveTextContent("12345678");
  });

  test("works if auth.user is missing", () => {
    // Arrange
    // remock to enter empty user
    jest.doMock("../../context/auth", () => ({
      useAuth: () => [ { user: undefined } ],
    }));
    const FreshDashboard = require("AdminDashboard.js").default;

    // Act
    render(<FreshDashboard />);

    // Assert
    expect(screen.getByText(/Admin Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Email/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Contact/i)).toBeInTheDocument();
  });
});
