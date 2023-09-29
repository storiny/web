import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import RemoveAccount from "./remove-account";

const noop = (): void => undefined;

describe("<RemoveAccount />", () => {
  it("renders validation messages", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(
      <RemoveAccount onRemove={noop} on_submit={mockSubmit} vendor={"Apple"} />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: /disconnect/i }) // Open modal
      );
    });

    await act(async () => {
      await user.type(screen.getByTestId("current-password-input"), " "); // The button is disabled until the form is dirty
      await user.click(screen.getByRole("button", { name: /confirm/i }));
    });

    await wait_for(() => {
      expect(screen.queryAllByRole("alert").length).not.toEqual(0);
      expect(mockSubmit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(
      <RemoveAccount onRemove={noop} on_submit={mockSubmit} vendor={"Apple"} />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: /disconnect/i }) // Open modal
      );
    });

    await act(async () => {
      await user.type(
        screen.getByTestId("current-password-input"),
        "test-password"
      );
      await user.click(screen.getByRole("button", { name: /confirm/i }));
    });

    await wait_for(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "current-password": "test-password"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
