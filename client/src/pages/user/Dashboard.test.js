import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard"; 
import { useAuth } from "../../context/auth";

// 1. Mock UserMenu
jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="user-menu">Mocked UserMenu</div>
));

// 2. Mock useAuth
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/Layout", () => {
  return function MockLayout({ title, children }) {
    return (
      <div data-testid="layout">
        <div data-testid="layout-title">{title}</div>
        <div data-testid="layout-children">{children}</div>
      </div>
    );
  };
});


describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders UserMenu (mocked)", () => {
    useAuth.mockReturnValue([{ user: { name: "Test", email: "t@test.com", address: "123 St" } }]);
    render(<Dashboard />);
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
  });

  it("renders user info when auth has valid user", () => {
    useAuth.mockReturnValue([
      {
        user: {
          name: "Alice",
          email: "alice@example.com",
          address: "123 Wonderland",
        },
        token: "fake-jwt",
      },
    ]);

    render(<Dashboard />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("123 Wonderland")).toBeInTheDocument();
  });

  it("renders nothing user-related when auth.user is null", () => {
    useAuth.mockReturnValue([{ user: null, token: null }]);

    render(<Dashboard />);

    // Should still render UserMenu
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();

    // Should not render user info
    expect(screen.queryByText(/@/)).not.toBeInTheDocument(); // email pattern
    expect(screen.queryByText("123 Wonderland")).not.toBeInTheDocument();
  });
});
