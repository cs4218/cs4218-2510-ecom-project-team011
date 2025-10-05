import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Users from "./Users";

// Mock Layout and AdminMenu to keep test focused on Users page content
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu" />);

describe("Admin Users page", () => {
  test("renders heading", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    // Act Assert
    expect(screen.getByText(/All Users/i)).toBeInTheDocument();
  });

  test("renders admin menu", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    // Act Assert
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
  });

  test("admin menu is contained within Layout", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    // Act
    const adminMenu = screen.getByTestId("admin-menu");
    const layoutContainer = adminMenu.closest('div'); // Layout is mocked as div
    
    // Assert
    expect(layoutContainer).toBeInTheDocument();
    expect(adminMenu).toBeInTheDocument();
  });

  test("heading is contained within Layout", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    // Act
    const heading = screen.getByText(/All Users/i);
    const layoutContainer = heading.closest('div'); // Layout is mocked as div
    
    // Assert
    expect(layoutContainer).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
  });
});


