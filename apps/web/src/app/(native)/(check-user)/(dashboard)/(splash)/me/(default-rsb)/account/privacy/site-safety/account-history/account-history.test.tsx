import { user_event } from "@storiny/test-utils";
import { screen } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

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

    await user.click(screen.getByRole("switch"));

    expect(mock_submit).toHaveBeenCalledWith({
      read_history: false
    });
  });
});
