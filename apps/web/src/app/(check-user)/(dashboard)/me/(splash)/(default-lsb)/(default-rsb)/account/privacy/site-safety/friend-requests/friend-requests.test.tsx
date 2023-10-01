import { IncomingFriendRequest } from "@storiny/shared";
import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import FriendRequests from "./friend-requests";

describe("<FriendRequests />", () => {
  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <FriendRequests
        incoming_friend_requests={IncomingFriendRequest.EVERYONE}
        on_submit={mock_submit}
      />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(screen.getByLabelText(/no one/i));
    });

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        friend_requests: `${IncomingFriendRequest.NONE}`
      });
    });
  });
});
