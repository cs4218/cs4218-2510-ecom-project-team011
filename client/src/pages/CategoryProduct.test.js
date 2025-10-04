import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";
import Layout from "../components/Layout";

const mockNavigate = jest.fn();

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  useParams: () => ({ slug: "test-product" }),
  useNavigate: () => mockNavigate,
}));

jest.mock("./../components/Layout", () => {
  return function Layout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Generated with the help of AI (ChatGPT and Github Copilot)
describe("ProductDetails", () => {
  // Assign
  const mockCategory = {
    isActive: true,
    name: "Electronics",
    slug: "electronics",
    _id: "id-1",
  };
  const mockProducts = [
    {
      name: "Smartphone",
      slug: "smartphone",
      description: "A high-end smartphone with great features.",
      price: 10,
      category: mockCategory,
      quantity: 10,
      photo: {
        data: "mockdata1",
        contentType: "image/jpeg",
      },
      shipping: true,
    },
    {
      name: "Laptop",
      slug: "laptop",
      description: "A powerful laptop for professionals.",
      price: 999,
      category: mockCategory,
      quantity: 5,
      photo: {
        data: "mockdata2",
        contentType: "image/png",
      },
      shipping: false,
    },
  ];

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes("product/product-category")) {
        return Promise.resolve({
          data: {
            success: true,
            message: "Products by category retrieved",
            category: mockCategory,
            products: mockProducts,
          },
        });
      }
    });
  });

  afterAll(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  it("should render properly", async () => {
    // Act
    render(<CategoryProduct />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(
        screen.getByText(`Category - ${mockCategory.name}`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${mockProducts.length} results found`)
      ).toBeInTheDocument();
      expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
      expect(screen.getByText(mockProducts[1].name)).toBeInTheDocument();
      expect(
        screen.getByText(`$${mockProducts[0].price}.00`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`$${mockProducts[1].price}.00`)
      ).toBeInTheDocument();

      const buttons = screen.getAllByRole("button", { name: /More Details/i });
      expect(buttons).toHaveLength(mockProducts.length);
    });
  });

  it("should redirect to the appropriate url when more details is clicked", async () => {
    // Act
    render(<CategoryProduct />);

    // Assert
    await waitFor(() => {
      const moreDetailsButtons = screen.getAllByRole("button", {
        name: /More Details/i,
      });

      fireEvent.click(moreDetailsButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith(
        `/product/${mockProducts[0].slug}`
      );

      fireEvent.click(moreDetailsButtons[1]);

      expect(mockNavigate).toHaveBeenCalledWith(
        `/product/${mockProducts[1].slug}`
      );
    });
  });
});
