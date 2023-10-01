import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import AuthState from "../../../state";
import LoginForm from "./form";

describe("<LoginForm />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <AuthState>
        <LoginForm on_submit={mock_submit} />
      </AuthState>
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /log in/i }));
    });

    await wait_for(() => {
      expect(screen.getAllByRole("alert")).toHaveLength(2);
      expect(mock_submit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <AuthState>
        <LoginForm on_submit={mock_submit} />
      </AuthState>
    );

    await act(async () => {
      await user.type(screen.getByTestId("email-input"), "someone@example.com");
      await user.type(screen.getByTestId("password-input"), "test-password");
      await user.click(screen.getByTestId("remember-me-checkbox"));
      await user.click(screen.getByRole("button", { name: /log in/i }));
    });

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        email: "someone@example.com",
        password: "test-password",
        remember_me: true
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
