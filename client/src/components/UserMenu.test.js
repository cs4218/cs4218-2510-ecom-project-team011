import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserMenu from "./UserMenu"; // adjust path

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

  it.skip("applies correct CSS classes to links", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const profileLink = screen.getByText("Profile");
    expect(profileLink).toHaveClass("list-group-item");
    expect(profileLink).toHaveClass("list-group-item-action");
  });
  // TODO: Simulate clicking
});
