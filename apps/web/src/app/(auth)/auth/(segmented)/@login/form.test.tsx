import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import AuthState from "../../../state";
import LoginForm from "./form";

describe("<LoginForm />", () => {
  it("renders validation messages", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <AuthState>
        <LoginForm onSubmit={mockSubmit} />
      </AuthState>
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /log in/i }));
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
        <LoginForm onSubmit={mockSubmit} />
      </AuthState>
    );

    await act(async () => {
      await user.type(screen.getByTestId("email-input"), "someone@example.com");
      await user.type(screen.getByTestId("password-input"), "test-password");
      await user.click(screen.getByTestId("remember-me-checkbox"));
      await user.click(screen.getByRole("button", { name: /log in/i }));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: "someone@example.com",
        password: "test-password",
        "remember-me": true
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
