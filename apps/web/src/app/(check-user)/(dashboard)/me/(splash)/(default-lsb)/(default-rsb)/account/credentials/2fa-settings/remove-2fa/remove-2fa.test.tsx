import { user_event } from "@storiny/test-utils";
import { screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Remove2FA from "./remove-2fa";

const noop = (): void => undefined;

describe("<Remove2FA />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <Remove2FA on_submit={mock_submit} set_enabled={noop} />,
      {
        logged_in: true
      }
    );

    await user.click(
      screen.getByRole("button", { name: /remove 2fa/i }) // Open modal
    );

    await user.type(screen.getByTestId("code-input"), " "); // The button is disabled until the form is dirty
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    await wait_for(() => {
      expect(screen.queryAllByRole("alert").length).not.toEqual(0);
      expect(mock_submit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <Remove2FA on_submit={mock_submit} set_enabled={noop} />,
      {
        logged_in: true
      }
    );

    await user.click(
      screen.getByRole("button", { name: /remove 2fa/i }) // Open modal
    );

    await user.type(screen.getByTestId("code-input"), "000000");
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        code: "000000"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
