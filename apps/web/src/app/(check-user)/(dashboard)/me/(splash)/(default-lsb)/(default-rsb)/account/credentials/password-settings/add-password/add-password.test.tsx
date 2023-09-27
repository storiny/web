import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import AddPassword from "./add-password";

describe("<AddPassword />", () => {
  it("renders validation messages", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(<AddPassword onSubmit={mockSubmit} />, {
      loggedIn: true
    });

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: /add a password/i }) // Open modal
      );
    });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /continue/i })); // Enter verification code screen
    });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /continue/i })); // Enter password screen
    });

    await act(async () => {
      await screen.findByTestId("new-password-input");
      await user.type(screen.getByTestId("new-password-input"), " "); // The button is disabled until the form is dirty
      await user.click(screen.getByRole("button", { name: /continue/i })); // Finish
    });

    await waitFor(() => {
      expect(screen.queryAllByRole("alert").length).not.toEqual(0);
      expect(mockSubmit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(<AddPassword onSubmit={mockSubmit} />, {
      loggedIn: true
    });

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: /add a password/i }) // Open modal
      );
    });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /continue/i })); // Enter verification code screen
    });

    await act(async () => {
      await user.type(
        screen.getByTestId("verification-code-input"),
        "test-code"
      );
      await user.click(screen.getByRole("button", { name: /continue/i })); // Enter password screen
    });

    await act(async () => {
      await user.type(
        screen.getByTestId("new-password-input"),
        "test-password"
      );
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "verification-code": "test-code",
        "new-password": "test-password"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
