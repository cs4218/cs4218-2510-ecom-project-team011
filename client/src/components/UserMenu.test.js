import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import UserMenu from "./UserMenu"; // adjust path
import { act } from 'react-dom/test-utils';

describe("UserMenu", () => {
  it("renders dashboard heading", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders Profile and Orders links", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const profileLink = screen.getByText("Profile");
    const ordersLink = screen.getByText("Orders");

    expect(profileLink).toBeInTheDocument();
    expect(ordersLink).toBeInTheDocument();

    // check correct hrefs
    expect(profileLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/user/profile"
    );
    expect(ordersLink.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/user/orders"
    );
  });

  it("navigates to Profile page on click", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<UserMenu />} />
          <Route path="/dashboard/user/profile" element={<div>Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // simulate click
    
    act(() => {
      fireEvent.click(screen.getByText("Profile"));
    })

    // assert navigation
    expect(await screen.findByText("Profile Page")).toBeInTheDocument();
  });

  it("navigates to Orders page on click", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<UserMenu />} />
          <Route path="/dashboard/user/orders" element={<div>Orders Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    act(() => {
      fireEvent.click(screen.getByText("Orders"));
    })

    expect(await screen.findByText("Orders Page")).toBeInTheDocument();
  });

});
