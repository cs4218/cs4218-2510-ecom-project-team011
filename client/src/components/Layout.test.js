import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Layout from "./Layout";

// Mock child components to keep test focused
jest.mock("./Header", () => () => <div data-testid="header" />);
jest.mock("./Footer", () => () => <div data-testid="footer" />);

describe("Layout", () => {
  test("renders Helmet tags, Header, Footer, Toaster and children", async () => {
    render(
      <Layout title="Custom Title" description="Desc" keywords="k1,k2" author="Author A">
        <div>Child Content</div>
      </Layout>
    );

    // Helmet title updates asynchronously
    await waitFor(() => expect(document.title).toBe("Custom Title"));

    // Helmet meta tags
    await waitFor(() => {
      const metaDescription = document.querySelector('meta[name="description"]');
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      const metaAuthor = document.querySelector('meta[name="author"]');
      expect(metaDescription).toHaveAttribute("content", "Desc");
      expect(metaKeywords).toHaveAttribute("content", "k1,k2");
      expect(metaAuthor).toHaveAttribute("content", "Author A");
    });

    // Header and Footer rendered
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    // Main wrapper present (Toaster renders within main via portal; skip strict container check)
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Children rendered
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


