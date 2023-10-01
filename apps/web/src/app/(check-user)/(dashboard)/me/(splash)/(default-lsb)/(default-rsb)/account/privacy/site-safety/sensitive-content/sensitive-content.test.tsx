import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import SensitiveContent from "./sensitive-content";

describe("<SensitiveContent />", () => {
  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <SensitiveContent allow_sensitive_media on_submit={mock_submit} />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(screen.getByRole("switch"));
    });

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        sensitive_content: false
      });
    });
  });
});
