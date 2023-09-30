import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../packages/ui/src/redux/test-utils";

import AuthState from "../../../state";
import SignupUsernameForm from "./form";

describe("<SignupUsernameForm />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <AuthState>
        <SignupUsernameForm on_submit={mock_submit} skip_validation />
      </AuthState>
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await wait_for(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(mock_submit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <AuthState>
        <SignupUsernameForm on_submit={mock_submit} skip_validation />
      </AuthState>
    );

    await act(async () => {
      await user.type(screen.getByTestId("username-input"), "test_username");
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        username: "test_username"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
