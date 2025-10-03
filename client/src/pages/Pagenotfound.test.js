import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Pagenotfound from "./Pagenotfound";

// Mock Layout to keep test focused on page content
jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);

describe("Pagenotfound page", () => {
  test("renders 404 content and go back link", () => {
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/Oops ! Page Not Found/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Go Back/i });
    expect(link).toHaveAttribute("href", "/");
  });
});


