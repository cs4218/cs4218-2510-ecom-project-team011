import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import About from "./About";

// Mock Layout to keep test focused on page content
jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);

describe("About page", () => {
  test("renders about image", () => {
    // Arrange
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    // Act
    const img = screen.getByRole("img", { name: /contactus/i });
    
    // Assert
    expect(img).toBeInTheDocument();
  });

  test("image has correct source attribute", () => {
    // Arrange
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    // Act
    const img = screen.getByRole("img", { name: /contactus/i });
    
    // Assert
    expect(img).toHaveAttribute("src", "/images/about.jpeg");
  });

  test("image has correct width style", () => {
    // Arrange
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    // Act
    const img = screen.getByRole("img", { name: /contactus/i });
    
    // Assert
    expect(img).toHaveStyle("width: 100%");
  });

  test("renders about text content", () => {
    // Arrange
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    // Act Assert
    expect(screen.getByText(/Add text/i)).toBeInTheDocument();
  });

  test("image has correct alt text for accessibility", () => {
    // Arrange
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    // Act
    const img = screen.getByRole("img", { name: /contactus/i });
    
    // Assert
    expect(img).toHaveAttribute("alt", "contactus");
  });
});


