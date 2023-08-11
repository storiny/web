import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Remove2FA from "./remove-2fa";

const noop = (): void => undefined;

describe("<Remove2FA />", () => {
  it("renders validation messages", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <Remove2FA onSubmit={mockSubmit} setEnabled={noop} />,
      {
        loggedIn: true
      }
    );

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: /remove 2fa/i }) // Open modal
      );
    });

    await act(async () => {
      await user.type(screen.getByTestId("code-input"), " "); // The button is disabled until the form is dirty
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
      <Remove2FA onSubmit={mockSubmit} setEnabled={noop} />,
      {
        loggedIn: true
      }
    );

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: /remove 2fa/i }) // Open modal
      );
    });

    await act(async () => {
      await user.type(screen.getByTestId("code-input"), "000000");
      await user.click(screen.getByRole("button", { name: /confirm/i }));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        code: "000000"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
