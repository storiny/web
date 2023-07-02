import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import AuthState from "../../../state";
import ResetForm from "./form";

describe("<ResetForm />", () => {
  it("renders validation messages", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <AuthState>
        <ResetForm onSubmit={mockSubmit} token={""} />
      </AuthState>
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await waitFor(() => {
      expect(screen.getAllByRole("alert")).toHaveLength(2);
      expect(mockSubmit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <AuthState>
        <ResetForm onSubmit={(values): void => mockSubmit(values)} token={""} />
      </AuthState>
    );

    await act(async () => {
      await user.type(screen.getByTestId("email-input"), "someone@example.com");
      await user.type(screen.getByTestId("password-input"), "test-password");
      await user.click(screen.getByTestId("logout-checkbox"));
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: "someone@example.com",
        password: "test-password",
        "logout-of-all-devices": true
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
