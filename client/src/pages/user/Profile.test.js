// Profile.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "./Profile";
import axios from "axios";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";

// mocks
jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));
jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="usermenu">User Menu</div>
));

describe("Profile Component", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("renders user data into form inputs", () => {
    const fakeAuth = {
      user: { name: "CJ", email: "cj@test.com", phone: "123", address: "SG" },
    };
    useAuth.mockReturnValue([fakeAuth, jest.fn()]);

    render(<Profile />);

    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("CJ");
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe("cj@test.com");
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe("123");
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe("SG");
  });

  it("submits and updates profile successfully", async () => {
    const fakeAuth = {
      user: { name: "CJ", email: "cj@test.com", phone: "123", address: "SG" },
    };
    const setAuth = jest.fn();
    useAuth.mockReturnValue([fakeAuth, setAuth]);

    const updatedUser = { ...fakeAuth.user, name: "CJ Updated", password: "12345" };
    axios.put.mockResolvedValueOnce({ data: { updatedUser } });

    localStorage.setItem("auth", JSON.stringify({ user: fakeAuth.user }));

    render(<Profile />);

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "CJ Updated" },
    });

    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "12345" },
    });

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "cj@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "cj street" },
    });

    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "81234567" },
    });
    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", expect.objectContaining({
        name: "CJ Updated",
        email: "cj@example.com",
        password: "12345",
        address: "cj street",
        phone: "81234567",
      }));
    });

    expect(setAuth).toHaveBeenCalledWith(expect.objectContaining({ user: updatedUser }));
    expect(JSON.parse(localStorage.getItem("auth")).user).toEqual(updatedUser);
    expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
  });

  it("handles server error response", async () => {
    const fakeAuth = {
      user: { name: "CJ", email: "cj@test.com", phone: "123", address: "SG" },
    };
    useAuth.mockReturnValue([fakeAuth, jest.fn()]);

    axios.put.mockResolvedValueOnce({ data: { error: "Invalid data" } });

    render(<Profile />);
    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid data");
    });
  });

  it("handles network error (no internet)", async () => {
    const fakeAuth = {
      user: { name: "CJ", email: "cj@test.com", phone: "123", address: "SG" },
    };
    useAuth.mockReturnValue([fakeAuth, jest.fn()]);

    axios.put.mockRejectedValueOnce(new Error("Network Error"));

    render(<Profile />);
    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});
