import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import { EmailSettings } from "./email-group";

describe("<EmailSettings />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <EmailSettings has_password on_submit={mock_submit} />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: /change e-mail/i }) // Open modal
      );
    });

    await act(async () => {
      await user.type(screen.getByTestId("current-password-input"), " "); // The button is disabled until the form is dirty
      await user.click(screen.getByRole("button", { name: /confirm/i }));
    });

    await wait_for(() => {
      expect(screen.queryAllByRole("alert").length).not.toEqual(0);
      expect(mock_submit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <EmailSettings has_password on_submit={mock_submit} />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: /change e-mail/i }) // Open modal
      );
    });

    await act(async () => {
      await user.type(
        screen.getByTestId("new-email-input"),
        "test@example.com"
      );
      await user.type(
        screen.getByTestId("current-password-input"),
        "test-password"
      );
      await user.click(screen.getByRole("button", { name: /confirm/i }));
    });

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        new_email: "test@example.com",
        current_password: "test-password"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
