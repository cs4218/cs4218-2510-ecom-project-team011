import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import CategoryForm from "./CategoryForm"; 

describe("CategoryForm", () => {

    // TEST #1
  test("renders a controlled input and a submit button", () => {
    // Arrange
    const handleSubmit = jest.fn();
    const setValue = jest.fn();

    // Act
    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value="Phones"
        setValue={setValue}
      />
    );

    // Assert
    const input = screen.getByPlaceholderText(/enter new category/i);
    const button = screen.getByRole("button", { name: /submit/i });

    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Phones");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  // TEST #2
  test("typing calls setValue with latest text", async () => {
    // Arrange
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    const setValue = jest.fn();

    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value=""
        setValue={setValue}
      />
    );

    const input = screen.getByPlaceholderText(/enter new category/i);

    // Act
    await user.type(input, "Electronics");

    // Assert
    expect(setValue).toHaveBeenCalled(); // called for each keystroke
    const lastCallArg = setValue.mock.calls.at(-1)?.[0];
    expect(lastCallArg).toBe("Electronics");
  });

  // TEST #3
  test("submitting the form calls handleSubmit", async () => {
    // Arrange
    const user = userEvent.setup();
    const handleSubmit = jest.fn((e) => e.preventDefault());
    const setValue = jest.fn();

    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value="Books"
        setValue={setValue}
      />
    );

    const button = screen.getByRole("button", { name: /submit/i });

    // Act
    await user.click(button);

    // Assert
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    // It receives the submit event
    const eventArg = handleSubmit.mock.calls[0][0];
    expect(typeof eventArg?.preventDefault).toBe("function");
  });

  // TEST #4
  test("pressing Enter in the input submits the form", async () => {
    // Arrange
    const user = userEvent.setup();
    const handleSubmit = jest.fn((e) => e.preventDefault());
    const setValue = jest.fn();

    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value=""
        setValue={setValue}
      />
    );

    const input = screen.getByPlaceholderText(/enter new category/i);

    // Act
    await user.type(input, "Toys{enter}");

    // Assert
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
