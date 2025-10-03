import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Footer from "./Footer";

describe("Footer", () => {
  test("renders footer text", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/All Rights Reserved/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/TestingComp/i)).toBeInTheDocument();
  });

  test("renders About, Contact, and Privacy Policy links with correct routes", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const aboutLink = screen.getByRole("link", { name: /about/i });
    const contactLink = screen.getByRole("link", { name: /contact/i });
    const policyLink = screen.getByRole("link", { name: /privacy policy/i });

    expect(aboutLink).toHaveAttribute("href", "/about");
    expect(contactLink).toHaveAttribute("href", "/contact");
    expect(policyLink).toHaveAttribute("href", "/policy");
  });
});


