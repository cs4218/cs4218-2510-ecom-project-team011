import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import HomePage from "./HomePage";
import axios from "axios";
import { useCart } from "../context/cart";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

// Mock external modules
jest.mock("axios");
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("react-icons/ai", () => ({
    AiOutlineReload: () => <span>Reload</span>,
  }));

// Mock child components properly
jest.mock("../components/Layout", () => ({ children, title }) => (
  <div>
    <h1>{title}</h1>
    {children}
  </div>
));

jest.mock("../components/Prices", () => ({
  Prices: [{ _id: "1", name: "0-500", array: [0, 500] }],
}));

// Mock Ant Design components
// Fix the Ant Design mocks to include the text content
jest.mock("antd", () => {
    const MockCheckbox = ({ children, onChange }) => (
      <label>
        <input type="checkbox" onChange={onChange} />
        {children}
      </label>
    );
    
    const MockRadio = ({ children, value, onChange }) => (
      <label>
        <input type="radio" value={value} onChange={onChange} />
        {children}
      </label>
    );
    
    const MockRadioGroup = ({ children, onChange }) => (
      <div role="radiogroup" onChange={onChange}>{children}</div>
    );
    
    return {
      Checkbox: MockCheckbox,
      Radio: Object.assign(MockRadio, { Group: MockRadioGroup }),
    };
  });

describe("HomePage", () => {
  const mockSetCart = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    useCart.mockReturnValue([[], mockSetCart]);
    useNavigate.mockReturnValue(mockNavigate);
    
    // Mock all API calls
    axios.get.mockImplementation((url) => {
      if (url.includes("/category/get-category")) {
        return Promise.resolve({ 
          data: { 
            success: true, 
            category: [{ _id: "1", name: "Electronics" }] 
          } 
        });
      } else if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      } else if (url.includes("/product-list")) {
        return Promise.resolve({ 
          data: { 
            products: [
              { 
                _id: "1", 
                name: "Test Product", 
                price: 100, 
                description: "Test Description", 
                slug: "test-product" 
              }
            ] 
          } 
        });
      }
      return Promise.reject(new Error("Not mocked"));
    });

    axios.post.mockResolvedValue({ 
      data: { 
        products: [
          { 
            _id: "2", 
            name: "Filtered Product", 
            price: 200, 
            description: "Filtered Description", 
            slug: "filtered-product" 
          }
        ] 
      } 
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders homepage and fetches products", async () => {
    await act(async () => {
      render(<HomePage />);
    });

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText("Test Product")).toBeInTheDocument();
    });
  });

  test("filters products by category", async () => {
    await act(async () => {
      render(<HomePage />);
    });

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Electronics"));
    });

    // Check if filter API was called
    expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
      checked: ["1"],
      radio: [],
    });
  });

  test("adds product to cart", async () => {
    await act(async () => {
      render(<HomePage />);
    });

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText("ADD TO CART")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("ADD TO CART"));
    });

    expect(mockSetCart).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Item Added to cart');
  });
});
