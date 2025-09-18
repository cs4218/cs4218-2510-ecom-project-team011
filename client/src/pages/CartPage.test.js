// client/src/pages/CartPage.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CartPage from "./CartPage";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { useNavigate } from "react-router-dom";

// ========= Mocks =========
jest.mock("axios");
jest.mock("react-hot-toast", () => ({ success: jest.fn(), error: jest.fn() }));

jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

// Keep instance above jest.mock due to hoisting
const mockInstance = { requestPaymentMethod: jest.fn() };

// ✅ DropIn mock: call onInstance inside useEffect (not during render)
jest.mock("braintree-web-drop-in-react", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onInstance }) => {
      React.useEffect(() => {
        if (onInstance) onInstance(mockInstance);
      }, [onInstance]);
      return <div data-testid="dropin">DropIn</div>;
    },
  };
});

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: jest.fn() };
});

// ========= Helpers =========
const setItemSpy = jest.spyOn(window.localStorage.__proto__, "setItem");
const getItemSpy = jest.spyOn(window.localStorage.__proto__, "getItem");
const removeItemSpy = jest.spyOn(window.localStorage.__proto__, "removeItem");

const renderWithState = ({
  auth = [{ user: null, token: null }, jest.fn()],
  cart = [[], jest.fn()],
} = {}) => {
  useAuth.mockReturnValue(auth);
  useCart.mockReturnValue(cart);
  return render(<CartPage />);
};

// Render + flush the token effect so act() warnings don't appear
const renderCart = async (state) => {
  renderWithState(state);
  await waitFor(() =>
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token")
  );
};

describe("CartPage", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getItemSpy.mockReturnValue(null);
    useNavigate.mockReturnValue(mockNavigate);

    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/product/braintree/token")) {
        return Promise.resolve({ data: { clientToken: "ctok_123" } });
      }
      return Promise.reject(new Error("unhandled GET"));
    });
  });

  test("renders guest greeting and empty cart message when not logged in and cart empty", async () => {
    await renderCart({
      auth: [{ user: null, token: null }, jest.fn()],
      cart: [[], jest.fn()],
    });

    expect(screen.getByText(/Hello Guest/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Cart Is Empty/i)).toBeInTheDocument();
    expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();
  });

  test("renders items and total, and allows removing an item", async () => {
    const setCart = jest.fn();
    const cartItems = [
      { _id: "a1", name: "Item A", description: "Desc A", price: 100 },
      { _id: "b2", name: "Item B", description: "Desc B", price: 50 },
    ];

    await renderCart({
      auth: [{ user: { name: "Neo" }, token: "tok" }, jest.fn()],
      cart: [cartItems, setCart],
    });

    // Now DropIn may render; it's fine—we don't interact with it.
    expect(screen.getByText("Item A")).toBeInTheDocument();
    expect(screen.getByText("Item B")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(/Total :/)).toHaveTextContent("$150.00")
    );

    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
    fireEvent.click(removeButtons[0]);

    expect(setCart).toHaveBeenCalledWith([
      { _id: "b2", name: "Item B", description: "Desc B", price: 50 },
    ]);
    expect(setItemSpy).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([{ _id: "b2", name: "Item B", description: "Desc B", price: 50 }])
    );
  });

  test("shows login CTA when not authenticated", async () => {
    await renderCart({
      auth: [{ user: null, token: null }, jest.fn()],
      cart: [[{ _id: "c1", name: "X", description: "Y", price: 10 }], jest.fn()],
    });

    const loginBtn = screen.getByRole("button", { name: /Plase Login to checkout/i }); // original text
    expect(loginBtn).toBeInTheDocument();

    fireEvent.click(loginBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/cart" });
  });

  test("shows current address and Update Address button when authenticated with address", async () => {
    await renderCart({
      auth: [{ user: { name: "Trin", address: "Matrix St 01" }, token: "tok" }, jest.fn()],
      cart: [[{ _id: "c1", name: "X", description: "Y", price: 10 }], jest.fn()],
    });

    expect(screen.getByText(/Current Address/i)).toBeInTheDocument();
    expect(screen.getByText("Matrix St 01")).toBeInTheDocument();

    const updateBtn = screen.getByRole("button", { name: /Update Address/i });
    fireEvent.click(updateBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
  });

  test("does not render DropIn until clientToken, token, and cart exist", async () => {
    await renderCart({
      auth: [{ user: { name: "A" }, token: null }, jest.fn()],
      cart: [[{ _id: "1", name: "X", description: "D", price: 10 }], jest.fn()],
    });
    expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();
  });

  test("renders DropIn and allows successful payment flow", async () => {
    const setCart = jest.fn();

    mockInstance.requestPaymentMethod.mockResolvedValueOnce({ nonce: "nonce_abc" });
    axios.post = jest.fn().mockResolvedValueOnce({ data: { ok: true } });

    await renderCart({
      auth: [{ user: { name: "Pay User", address: "Addr 9" }, token: "tok" }, jest.fn()],
      cart: [
        [
          { _id: "a1", name: "Item A", description: "Desc A", price: 100 },
          { _id: "b2", name: "Item B", description: "Desc B", price: 50 },
        ],
        setCart,
      ],
    });

    // DropIn should appear (token + cart + token fetched)
    await waitFor(() => expect(screen.getByTestId("dropin")).toBeInTheDocument());

    const payBtn = screen.getByRole("button", { name: /Make Payment/i });
    expect(payBtn).toBeEnabled();

    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(mockInstance.requestPaymentMethod).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith("/api/v1/product/braintree/payment", {
        nonce: "nonce_abc",
        cart: [
          { _id: "a1", name: "Item A", description: "Desc A", price: 100 },
          { _id: "b2", name: "Item B", description: "Desc B", price: 50 },
        ],
      });
      expect(removeItemSpy).toHaveBeenCalledWith("cart");
      expect(setCart).toHaveBeenCalledWith([]);
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
      expect(toast.success).toHaveBeenCalledWith("Payment Completed Successfully ");
    });
  });

  test("payment button disabled when no address or no instance", async () => {
    await renderCart({
      auth: [{ user: { name: "NoAddr" }, token: "tok" }, jest.fn()],
      cart: [[{ _id: "1", name: "X", description: "D", price: 10 }], jest.fn()],
    });

    await waitFor(() => expect(screen.getByTestId("dropin")).toBeInTheDocument());
    const payBtn = screen.getByRole("button", { name: /Make Payment/i });
    expect(payBtn).toBeDisabled();
  });
});
