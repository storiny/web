import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import RemoveAccount from "./remove-account";

const noop = (): void => undefined;

describe("<RemoveAccount />", () => {
  it("renders validation messages", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <RemoveAccount onRemove={noop} onSubmit={mockSubmit} vendor={"Apple"} />,
      {
        loggedIn: true
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

    await waitFor(() => {
      expect(screen.queryAllByRole("alert").length).not.toEqual(0);
      expect(mockSubmit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <RemoveAccount onRemove={noop} onSubmit={mockSubmit} vendor={"Apple"} />,
      {
        loggedIn: true
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

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "current-password": "test-password"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
