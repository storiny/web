import { user_event } from "@storiny/test-utils";
import { screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import DisableAccount from "./disable-account";

describe("<DisableAccount />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(<DisableAccount on_submit={mock_submit} />, {
      logged_in: true
    });

    await user.click(
      screen.getByRole("button", { name: /temporarily disable account/i }) // Open modal
    );

    await user.type(screen.getByTestId("current-password-input"), " "); // The button is disabled until the form is dirty
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    await wait_for(() => {
      expect(screen.queryAllByRole("alert").length).not.toEqual(0);
      expect(mock_submit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(<DisableAccount on_submit={mock_submit} />, {
      logged_in: true
    });

    await user.click(
      screen.getByRole("button", { name: /temporarily disable account/i }) // Open modal
    );

    await user.type(
      screen.getByTestId("current-password-input"),
      "test-password"
    );

    await user.click(screen.getByRole("button", { name: /confirm/i }));

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        current_password: "test-password"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
