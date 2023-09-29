import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../packages/ui/src/redux/test-utils";

import AuthState from "../../../state";
import SignupBaseForm from "./form";

describe("<SignupBaseForm />", () => {
  it("renders validation messages", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(
      <AuthState>
        <SignupBaseForm on_submit={mockSubmit} />
      </AuthState>
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await wait_for(() => {
      expect(screen.getAllByRole("alert")).toHaveLength(3);
      expect(mockSubmit).not.toBeCalled();
    });
  });

  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(
      <AuthState>
        <SignupBaseForm on_submit={(values): void => mockSubmit(values)} />
      </AuthState>
    );

    await act(async () => {
      await user.type(screen.getByTestId("name-input"), "test name");
      await user.type(screen.getByTestId("email-input"), "someone@example.com");
      await user.type(screen.getByTestId("password-input"), "test-password");
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await wait_for(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: "someone@example.com",
        password: "test-password",
        name: "test name"
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
