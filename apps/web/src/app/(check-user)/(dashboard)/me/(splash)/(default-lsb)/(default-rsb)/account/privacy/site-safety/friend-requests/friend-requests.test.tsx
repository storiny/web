import { IncomingFriendRequest } from "@storiny/shared";
import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import FriendRequests from "./friend-requests";

describe("<FriendRequests />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(
      <FriendRequests
        incoming_friend_requests={IncomingFriendRequest.EVERYONE}
        on_submit={mockSubmit}
      />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(screen.getByLabelText(/no one/i));
    });

    await wait_for(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "friend-requests": `${IncomingFriendRequest.NONE}`
      });
    });
  });
});
