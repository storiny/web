import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import AuthState from "../../../state";
import RecoveryForm from "./form";

describe("<RecoveryForm />", () => {
  it("renders validation messages", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <AuthState>
        <RecoveryForm onSubmit={mockSubmit} />
      </AuthState>
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(mockSubmit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <AuthState>
        <RecoveryForm onSubmit={mockSubmit} />
      </AuthState>
    );

    await act(async () => {
      await user.type(screen.getByTestId("email-input"), "someone@example.com");
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: "someone@example.com"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
