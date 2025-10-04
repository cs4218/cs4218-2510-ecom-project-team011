import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import ProductDetails from "./ProductDetails";
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
  const mockProduct = {
    _id: "1",
    name: "Test Product",
    price: 100,
    description: "Test Description 1",
    category: {
      _id: "1",
      name: "Electronics",
      slug: "electronics",
    },
    slug: "test-product-1",
  };
  const mockProducts = [
    {
      _id: "2",
      name: "Test Product 2",
      price: 200,
      description: "Test Description 2",
      category: {
        _id: "1",
        name: "Electronics",
        slug: "electronics",
      },
      slug: "test-product-2",
    },
    {
      _id: "3",
      name: "Test Product 3",
      price: 300,
      description: "Test Description 3",
      category: {
        _id: "1",
        name: "Electronics",
        slug: "electronics",
      },
      slug: "test-product-3",
    },
    {
      _id: "4",
      name: "Test Product 4",
      price: 300,
      description:
        "Test Description 4reallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallyreallylong",
      category: {
        _id: "1",
        name: "Electronics",
        slug: "electronics",
      },
      slug: "test-product-3",
    },
  ];

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  beforeEach(() => {
    // Assign
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes("/product/get-product")) {
        return Promise.resolve({
          data: {
            success: true,
            message: "Single Product Fetched",
            product: mockProduct,
          },
        });
      } else if (url.includes("/product/related-product")) {
        return Promise.resolve({
          data: {
            success: true,
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
    render(<ProductDetails />);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByAltText(mockProduct.name)).toBeInTheDocument();
      expect(screen.getByText(mockProducts[0].description)).toBeInTheDocument();
      expect(screen.getByText(mockProducts[1].description)).toBeInTheDocument();
      expect(
        screen.getByText(mockProducts[2].description.substring(0, 60) + "...")
      ).toBeInTheDocument();
    });
  });

  it("should redirect to the appropriate url when more details is clicked", async () => {
    // Act
    render(<ProductDetails />);

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
