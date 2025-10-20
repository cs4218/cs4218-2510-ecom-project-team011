import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";
import toast from "react-hot-toast";
import { CartProvider } from "../context/cart";
import Layout from "../components/Layout";

const mockNavigate = jest.fn();

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: "test-product" }),
  useNavigate: () => mockNavigate,
}));

jest.mock("./../components/Layout", () => {
  return function Layout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

const renderWithProviders = (ui) => {
  return render(
    <CartProvider>
      <MemoryRouter initialEntries={["/category/test-product"]}>
        <Routes>
          <Route path="/category/:slug" element={ui} />
        </Routes>
      </MemoryRouter>
    </CartProvider>
  );
};

// Generated with the help of AI (ChatGPT and Github Copilot)
describe("CategoryProduct", () => {
  // Arrange
  const mockCategory = {
    isActive: true,
    name: "Electronics",
    slug: "electronics",
    _id: "id-1",
  };
  const mockProducts = [
    {
      name: "Computer",
      slug: "computer",
      // 61 characters, so should be truncated with ellipses
      description:
        "0123456789012345678901234567890123456789012345678901234567890",
      price: 500,
      category: mockCategory,
      quantity: 5,
      photo: {
        data: "mockdata2",
        contentType: "image/png",
      },
      shipping: false,
    },
    {
      name: "Laptop",
      slug: "laptop",
      // 60 characters, so should not be truncated
      description:
        "012345678901234567890123456789012345678901234567890123456789",
      price: 999,
      category: mockCategory,
      quantity: 5,
      photo: {
        data: "mockdata2",
        contentType: "image/png",
      },
      shipping: false,
    },
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
    renderWithProviders(<CategoryProduct />);

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

  it("should render descriptions of different length properly", async () => {
    // Act
    renderWithProviders(<CategoryProduct />);

    // Assert
    await waitFor(() => {
      // very long descriptions should not be rendered in full; rendered with ellipses
      expect(
        screen.getByText(mockProducts[0].description.substring(0, 60) + "...")
      ).toBeInTheDocument();
      // shorter descriptions should be rendered in full
      expect(screen.getByText(mockProducts[1].description)).toBeInTheDocument();
      expect(screen.getByText(mockProducts[2].description)).toBeInTheDocument();
    });
  });

  it("should redirect to the appropriate url when more details is clicked", async () => {
    // Act
    renderWithProviders(<CategoryProduct />);

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

  it("should add item to cart when 'ADD TO CART' is clicked", async () => {
    // Act
    renderWithProviders(<CategoryProduct />);

    const addToCartButtons = await screen.findAllByRole("button", {
      name: /ADD TO CART/i,
    });

    fireEvent.click(addToCartButtons[1]);

    // Assert
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
    expect(toast.success).toHaveBeenCalledTimes(1);

    const expectedCart = [mockProducts[1]];
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify(expectedCart)
    );
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
  });
});
