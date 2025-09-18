import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";

function CartConsumer() {
  const [cart, setCart] = useCart();
  return (
    <div>
      <div data-testid="count">{cart.length}</div>
      <button onClick={() => setCart((prev) => [...prev, { id: "x", name: "Item" }])}>
        add
      </button>
    </div>
  );
}

describe("CartProvider / useCart", () => {
  let getItemSpy;

  beforeEach(() => {
    // default: nothing in storage
    getItemSpy = jest
      .spyOn(window.localStorage.__proto__, "getItem")
      .mockReturnValue(null);
  });

  afterEach(() => {
    getItemSpy.mockRestore();
    jest.clearAllMocks();
  });

  test("loads cart from localStorage on mount", async () => {
    getItemSpy.mockReturnValueOnce(JSON.stringify([{ id: "1", name: "Saved" }]));

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    expect(getItemSpy).toHaveBeenCalledWith("cart");
    // wait for the effect to set state
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
  });

  test("defaults to empty array when localStorage has nothing", async () => {
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    expect(getItemSpy).toHaveBeenCalledWith("cart");
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));
  });

  test("setCart updates consumers", async () => {
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // initial after effect
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));

    fireEvent.click(screen.getByText("add"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});
