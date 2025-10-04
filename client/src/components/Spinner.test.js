import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import Spinner from "./Spinner";

function mockRender(ui, { initialEntries = ["/"], routes = [] } = {}) {
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

  test("shows countdown text", () => {
    // Arrange
    mockRender(<Spinner />);

    // Act & Assert
    expect(
      screen.getByText(/redirecting to you in/i)
    ).toBeInTheDocument();
  });

  test("shows loading spinner", () => {
    // Arrange
    mockRender(<Spinner />);

    // Act & Assert
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("countdown decreases over time", () => {
    // Arrange
    mockRender(<Spinner />);

    // Act & Assert - Initial countdown should show 3
    expect(screen.getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();

    // Act - Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Assert - Countdown should show 2
    expect(screen.getByText(/redirecting to you in 2 second/i)).toBeInTheDocument();

    // Act - Advance timer by another second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Assert - Countdown should show 1
    expect(screen.getByText(/redirecting to you in 1 second/i)).toBeInTheDocument();
  });

  test("navigates to default login path after countdown", () => {
    // Arrange
    mockRender(<Spinner />);

    // Act
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("navigates to provided custom path after countdown", () => {
    // Arrange
    mockRender(<Spinner path="dashboard" />);

    // Act
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert
    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });
});


