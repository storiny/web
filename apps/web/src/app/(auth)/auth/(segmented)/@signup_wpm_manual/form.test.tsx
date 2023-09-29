import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../packages/ui/src/redux/test-utils";

import AuthState from "../../../state";
import SignupWPMForm from "./form";

describe("<SignupWPMForm />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(
      <AuthState>
        <SignupWPMForm on_submit={mockSubmit} />
      </AuthState>
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await wait_for(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        wpm: 250
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
