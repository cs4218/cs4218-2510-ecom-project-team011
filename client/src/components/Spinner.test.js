import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import Spinner from "./Spinner";

function renderWithRouter(ui, { initialEntries = ["/"], routes = [] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={ui} />
        {/* capture default redirect target */}
        <Route path="/login" element={<div>Login Page</div>} />
        {/* capture custom redirect target */}
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        {routes}
      </Routes>
    </MemoryRouter>
  );
}

describe("Spinner", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  test("shows countdown text and spinner role", () => {
    renderWithRouter(<Spinner />);
    expect(
      screen.getByText(/redirecting to you in/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("navigates to default login path after countdown", () => {
    renderWithRouter(<Spinner />);

    // advance 3 seconds to trigger navigate
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("navigates to provided custom path after countdown", () => {
    renderWithRouter(<Spinner path="dashboard" />);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });
});


