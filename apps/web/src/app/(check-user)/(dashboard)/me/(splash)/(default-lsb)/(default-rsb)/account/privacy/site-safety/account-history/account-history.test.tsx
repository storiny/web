import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import AccountHistory from "./account-history";

describe("<AccountHistory />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(
      <AccountHistory onSubmit={mockSubmit} record_read_history />,
      {
        loggedIn: true
      }
    );

    await act(async () => {
      await user.click(screen.getByRole("switch"));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "read-history": false
      });
    });
  });
});
