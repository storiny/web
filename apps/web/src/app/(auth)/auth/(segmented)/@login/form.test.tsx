import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../packages/ui/src/redux/test-utils";

import AuthState from "../../../state";
import LoginForm from "./form";

describe("<LoginForm />", () => {
  it("renders validation messages", async () => {
    const mockSubmit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <AuthState>
        <LoginForm on_submit={mockSubmit} />
      </AuthState>
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /log in/i }));
    });

    await wait_for(() => {
      expect(screen.getAllByRole("alert")).toHaveLength(2);
      expect(mockSubmit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <AuthState>
        <LoginForm on_submit={mockSubmit} />
      </AuthState>
    );

    await act(async () => {
      await user.type(screen.getByTestId("email-input"), "someone@example.com");
      await user.type(screen.getByTestId("password-input"), "test-password");
      await user.click(screen.getByTestId("remember-me-checkbox"));
      await user.click(screen.getByRole("button", { name: /log in/i }));
    });

    await wait_for(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: "someone@example.com",
        password: "test-password",
        "remember-me": true
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
