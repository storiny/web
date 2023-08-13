import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import SensitiveContent from "./sensitive-content";

describe("<SensitiveContent />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <SensitiveContent allow_sensitive_media onSubmit={mockSubmit} />,
      {
        loggedIn: true
      }
    );

    await act(async () => {
      await user.click(screen.getByRole("switch"));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "sensitive-content": false
      });
    });
  });
});
