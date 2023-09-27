import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import UpdatePassword from "./update-password";

describe("<UpdatePassword />", () => {
  it("renders validation messages", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(<UpdatePassword onSubmit={mockSubmit} />, {
      loggedIn: true
    });

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: /update password/i }) // Open modal
      );
    });

    await act(async () => {
      await user.type(screen.getByTestId("new-password-input"), " "); // The button is disabled until the form is dirty
      await user.click(screen.getByRole("button", { name: /confirm/i }));
    });

    await waitFor(() => {
      expect(screen.queryAllByRole("alert").length).not.toEqual(0);
      expect(mockSubmit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(<UpdatePassword onSubmit={mockSubmit} />, {
      loggedIn: true
    });

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: /update password/i }) // Open modal
      );
    });

    await act(async () => {
      await user.type(
        screen.getByTestId("current-password-input"),
        "current-test-password"
      );
      await user.type(
        screen.getByTestId("new-password-input"),
        "new-test-password"
      );
      await user.click(screen.getByRole("button", { name: /confirm/i }));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "current-password": "current-test-password",
        "new-password": "new-test-password"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
