import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import AccountHistory from "./account-history";

describe("<AccountHistory />", () => {
  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <AccountHistory on_submit={mock_submit} record_read_history />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(screen.getByRole("switch"));
    });

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        read_history: false
      });
    });
  });
});
