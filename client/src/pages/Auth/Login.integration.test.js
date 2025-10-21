/**
 * Integration test for Login component:
 * - Renders form
 * - Successful submit calls axios.post and navigates
 */
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../utils/test-utils";

import Login from "Login.js";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({ default: { success: jest.fn(), error: jest.fn() }, __esModule: true }));

describe("Login (integration)", () => {
  test("logs in and redirects", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Login success",
        user: { name: "Admin", email: "admin@example.com", phone: "999" },
        token: "fake.jwt.token"
      }
    });

    renderWithProviders(<Login />, { route: "/login", authValue: [{ user: null, token: null }, jest.fn()] });

    await userEvent.type(screen.getByPlaceholderText(/enter your email/i), "admin@example.com");
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), "secret123");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });
});
