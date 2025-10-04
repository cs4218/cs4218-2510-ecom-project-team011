import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Footer from "./Footer";

describe("Footer", () => {
  test("renders copyright text", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // Act & Assert
    expect(
      screen.getByText(/All Rights Reserved/i)
    ).toBeInTheDocument();
  });

  test("renders company name", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // Act & Assert
    expect(screen.getByText(/TestingComp/i)).toBeInTheDocument();
  });

  test("renders about link with correct href", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // Act
    const aboutLink = screen.getByRole("link", { name: /about/i });

    // Assert
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  test("renders contact link with correct href", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // Act
    const contactLink = screen.getByRole("link", { name: /contact/i });

    // Assert
    expect(contactLink).toHaveAttribute("href", "/contact");
  });

  test("renders privacy policy link with correct href", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // Act
    const policyLink = screen.getByRole("link", { name: /privacy policy/i });

    // Assert
    expect(policyLink).toHaveAttribute("href", "/policy");
  });

  test("all footer links are clickable", () => {
    // Arrange
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // Act
    const aboutLink = screen.getByRole("link", { name: /about/i });
    const contactLink = screen.getByRole("link", { name: /contact/i });
    const policyLink = screen.getByRole("link", { name: /privacy policy/i });

    // Assert - Check that links are clickable (not disabled)
    expect(aboutLink).toBeEnabled();
    expect(contactLink).toBeEnabled();
    expect(policyLink).toBeEnabled();
  });
});


