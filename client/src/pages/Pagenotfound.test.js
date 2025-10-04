import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Pagenotfound from "./Pagenotfound";

// Mock Layout to keep test focused on page content
jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);

describe("Pagenotfound page", () => {
  test("renders 404 title", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    // Act Assert
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  test("renders page not found heading", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    // Act Assert
    expect(screen.getByText(/Oops ! Page Not Found/i)).toBeInTheDocument();
  });

  test("renders go back link", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    // Act
    const link = screen.getByRole("link", { name: /Go Back/i });
    
    // Assert
    expect(link).toBeInTheDocument();
  });

  test("go back link has correct href attribute", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    // Act
    const link = screen.getByRole("link", { name: /Go Back/i });
    
    // Assert
    expect(link).toHaveAttribute("href", "/");
  });

  test("404 title is rendered as h1 element", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    // Act
    const title = screen.getByRole("heading", { level: 1, name: "404" });
    
    // Assert
    expect(title).toBeInTheDocument();
  });

  test("page not found heading is rendered as h2 element", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    // Act
    const heading = screen.getByRole("heading", { level: 2, name: /Oops ! Page Not Found/i });
    
    // Assert
    expect(heading).toBeInTheDocument();
  });
});


