import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import AuthState from "../../../state";
import SignupWPMForm from "./form";

describe("<SignupWPMForm />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <AuthState>
        <SignupWPMForm onSubmit={mockSubmit} />
      </AuthState>
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /continue/i }));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        wpm: 250
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
