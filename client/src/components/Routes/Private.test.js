import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./Private";
import { useAuth } from "../../context/auth"; // adjust path to your useAuth

jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

// Mock Spinner to simplify test output
jest.mock("../Spinner", () => ({ path }) => <div>Loading... {path}</div>);

describe("PrivateRoute", () => {
  it("renders Spinner when no auth token", () => {
    useAuth.mockReturnValue([{ token: "" }, jest.fn()]);

    render(
      <MemoryRouter>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("renders Outlet when auth token exists and API returns ok=true", async () => {
    useAuth.mockReturnValue([{ token: "validToken" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText("Protected Content")).toBeInTheDocument()
    );
  });

  it("renders Spinner when auth token exists but API returns ok=false", async () => {
    useAuth.mockReturnValue([{ token: "invalidToken" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: false } });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Loading/)).toBeInTheDocument()
    );
  });
});
