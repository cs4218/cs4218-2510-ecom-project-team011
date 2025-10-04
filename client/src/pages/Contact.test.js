import React from "react";
import { render, screen } from "@testing-library/react";
import Contact from "./Contact";

jest.mock("./../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" title={title}>
        <div data-testid="layout-children">{children}</div>
      </div>
    );
  };
});

describe("Contact Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    test("renders without crashing", () => {
      expect(() => render(<Contact />)).not.toThrow();
    });
  });

  describe("Image Section", () => {
    test("renders image container with correct CSS class", () => {
      render(<Contact />);
      const imageContainer = document.querySelector(".col-md-6");
      expect(imageContainer).toBeInTheDocument();
    });
  });

  describe("Content Section", () => {
    test("renders content container with correct CSS class", () => {
      render(<Contact />);
      const contentContainer = document.querySelector(".col-md-4");
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe("Contact Information Section", () => {
    test("renders contact information along with icons", () => {
      render(<Contact />);
      expect(screen.queryByTestId("mail-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("phone-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("support-icon")).toBeInTheDocument();
      expect(
        screen.queryByText(/www.help@ecommerceapp.com/)
      ).toBeInTheDocument();
      expect(screen.queryByText(/012-3456789/)).toBeInTheDocument();
      expect(screen.queryByText(/1800-0000-0000/)).toBeInTheDocument();
    });
  });

});
