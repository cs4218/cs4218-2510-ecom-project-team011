import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Layout from "./Layout";

// Mock child components to keep test focused
jest.mock("./Header", () => () => <div data-testid="header" />);
jest.mock("./Footer", () => () => <div data-testid="footer" />);

describe("Layout", () => {
  test("renders document title from props", async () => {
    // Arrange
    render(
      <Layout title="Custom Title">
        <div>Child Content</div>
      </Layout>
    );

    // Act & Assert
    await waitFor(() => expect(document.title).toBe("Custom Title"));
  });

  test("renders meta description from props", async () => {
    // Arrange
    render(
      <Layout description="Custom Desc">
        <div>Child Content</div>
      </Layout>
    );

    // Act & Assert
    await waitFor(() => {
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription).toHaveAttribute("content", "Custom Desc");
    });
  });

  test("renders meta keywords from props", async () => {
    // Arrange
    render(
      <Layout keywords="key1,key2">
        <div>Child Content</div>
      </Layout>
    );

    // Act & Assert
    await waitFor(() => {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      expect(metaKeywords).toHaveAttribute("content", "key1,key2");
    });
  });

  test("renders meta author from props", async () => {
    // Arrange
    render(
      <Layout author="Custom Author">
        <div>Child Content</div>
      </Layout>
    );

    // Act & Assert
    await waitFor(() => {
      const metaAuthor = document.querySelector('meta[name="author"]');
      expect(metaAuthor).toHaveAttribute("content", "Custom Author");
    });
  });

  test("renders Header component", () => {
    // Arrange
    render(
      <Layout>
        <div>Child Content</div>
      </Layout>
    );

    // Act & Assert
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  test("renders Footer component", () => {
    // Arrange
    render(
      <Layout>
        <div>Child Content</div>
      </Layout>
    );

    // Act & Assert
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  test("renders main wrapper element", () => {
    // Arrange
    render(
      <Layout>
        <div>Child Content</div>
      </Layout>
    );

    // Act & Assert
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test("renders children content", () => {
    // Arrange
    render(
      <Layout>
        <div>Child Content</div>
      </Layout>
    );

    // Act & Assert
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  test("uses default props when none provided", async () => {
    render(
      <Layout>
        <div>Child</div>
      </Layout>
    );

    // Default title
    await waitFor(() => expect(document.title).toBe("Ecommerce app - shop now"));

    // Default meta values
    await waitFor(() => {
      expect(document.querySelector('meta[name="description"]').getAttribute("content")).toBe("mern stack project");
      expect(document.querySelector('meta[name="keywords"]').getAttribute("content")).toBe("mern,react,node,mongodb");
      expect(document.querySelector('meta[name="author"]').getAttribute("content")).toBe("Techinfoyt");
    });
  });
});


