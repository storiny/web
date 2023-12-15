import { user_event } from "@storiny/test-utils";
import { screen } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import AuthState from "../../../state";
import AlphaForm from "./form";

describe("<AlphaForm />", () => {
  it("renders validation messages", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <AuthState>
        <AlphaForm on_submit={mock_submit} />
      </AuthState>
    );

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(mock_submit).not.toHaveBeenCalled();
  });

  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <AuthState>
        <AlphaForm on_submit={mock_submit} />
      </AuthState>
    );

    await user.type(screen.getByTestId("alpha-invite-code-input"), "1234-5678");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mock_submit).toHaveBeenCalledWith({
      alpha_invite_code: "12345678"
    });
  });
});
