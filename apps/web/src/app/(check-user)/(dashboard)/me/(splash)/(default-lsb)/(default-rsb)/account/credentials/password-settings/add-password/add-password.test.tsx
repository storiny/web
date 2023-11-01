import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import AddPassword from "./add-password";

describe("<AddPassword />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(<AddPassword on_submit={mock_submit} />, {
      logged_in: true
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

    await wait_for(() => {
      expect(screen.queryAllByRole("alert").length).not.toEqual(0);
      expect(mock_submit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(<AddPassword on_submit={mock_submit} />, {
      logged_in: true
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
      await user.type(screen.getByTestId("verification-code-input"), "000000");
      await user.click(screen.getByRole("button", { name: /continue/i })); // Enter password screen
    });

    await act(async () => {
      await user.type(
        screen.getByTestId("new-password-input"),
        "test-password"
      );
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        verification_code: "000000",
        new_password: "test-password"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
