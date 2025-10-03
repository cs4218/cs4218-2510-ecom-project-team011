import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import About from "./About";

// Mock Layout to keep test focused on page content
jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);

describe("About page", () => {
  test("renders about image and text", () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    const img = screen.getByRole("img", { name: /contactus/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/about.jpeg");

    expect(screen.getByText(/Add text/i)).toBeInTheDocument();
  });
});


