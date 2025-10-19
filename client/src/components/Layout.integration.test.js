import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

import Layout from "./Layout";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import { SearchProvider } from "../context/search";

// Test wrapper with real providers
const TestWrapper = ({ children, initialRoute = "/" }) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          {children}
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  </MemoryRouter>
);

describe("Layout Integration Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Component Integration Tests (Top Layer)", () => {
    test("should render Header, main content, and Footer together", async () => {
      render(
        <TestWrapper>
          <Layout title="Integration Test">
            <div data-testid="page-content">Test Content</div>
          </Layout>
        </TestWrapper>
      );

      await waitFor(() => {
        // Header elements
        expect(screen.getByRole("link", { name: /virtual vault/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /categories/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();
        
        // Footer elements
        expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /contact/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /privacy policy/i })).toBeInTheDocument();
        
        // Main content area
        expect(screen.getByRole("main")).toBeInTheDocument();
        expect(screen.getByTestId("page-content")).toBeInTheDocument();
      });
    });

    test("should render search input from Header", async () => {
      render(
        <TestWrapper>
          <Layout title="Search Test">
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole("search")).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });
    });
  });

  describe("react-helmet integration tests (Tp[", () => {
    test("should set document title and meta tags", async () => {
      render(
        <TestWrapper>
          <Layout 
            title="Custom Title"
            description="Custom Description"
            keywords="custom,keywords"
            author="Custom Author"
          >
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      await waitFor(() => {
        const metaDescription = document.querySelector('meta[name="description"]');
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        const metaAuthor = document.querySelector('meta[name="author"]');
        const metaCharset = document.querySelector('meta[charset]');

        expect(document.title).toBe("Custom Title");
        expect(metaDescription).toHaveAttribute("content", "Custom Description");
        expect(metaKeywords).toHaveAttribute("content", "custom,keywords");
        expect(metaAuthor).toHaveAttribute("content", "Custom Author");
        expect(metaCharset).toHaveAttribute("charset", "utf-8");
      });
    });

    test("should use default props when none provided", async () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(document.title).toBe("Ecommerce app - shop now");
      });

      await waitFor(() => {
        const metaDescription = document.querySelector('meta[name="description"]');
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        const metaAuthor = document.querySelector('meta[name="author"]');

        expect(metaDescription).toHaveAttribute("content", "mern stack project");
        expect(metaKeywords).toHaveAttribute("content", "mern,react,node,mongodb");
        expect(metaAuthor).toHaveAttribute("content", "Techinfoyt");
      });
    });
  });
});