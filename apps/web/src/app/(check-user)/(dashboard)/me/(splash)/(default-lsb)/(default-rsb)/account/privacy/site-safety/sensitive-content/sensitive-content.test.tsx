import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import SensitiveContent from "./sensitive-content";

describe("<SensitiveContent />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <SensitiveContent allow_sensitive_media on_submit={mockSubmit} />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(screen.getByRole("switch"));
    });

    await wait_for(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "sensitive-content": false
      });
    });
  });
});
