import { user_event } from "@storiny/test-utils";
import { screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import AuthState from "../../../state";
import MFAForm from "./form";

describe("<MFAForm />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <AuthState>
        <MFAForm on_submit={mock_submit} />
      </AuthState>
    );

    await user.click(screen.getByRole("button", { name: /continue/i }));

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
        <MFAForm on_submit={mock_submit} />
      </AuthState>
    );

    await user.type(screen.getByTestId("mfa-code-input"), "123456");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        mfa_code: "123456"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
