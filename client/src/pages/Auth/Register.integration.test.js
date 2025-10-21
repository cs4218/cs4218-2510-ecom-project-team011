/**
 * Integration test for Register component.
 */
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../utils/test-utils";

import Register from "Register.js";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({ default: { success: jest.fn(), error: jest.fn() }, __esModule: true }));

describe("Register (integration)", () => {
  test("registers a new user", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "Registered" }
    });

    renderWithProviders(<Register />, { route: "/register" });

    await userEvent.type(screen.getByPlaceholderText(/enter your name/i), "Alice");
    await userEvent.type(screen.getByPlaceholderText(/enter your email/i), "alice@example.com");
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), "passpass");
    await userEvent.type(screen.getByPlaceholderText(/enter your phone/i), "123");
    await userEvent.type(screen.getByPlaceholderText(/enter your address/i), "42 Wallaby Way");
    const answer = screen.queryByPlaceholderText(/enter your secret answer/i) || screen.queryByPlaceholderText(/answer/i) || screen.getAllByRole("textbox").at(-1);
    if (answer) await userEvent.type(answer, "blue");

    await userEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
  });
});
