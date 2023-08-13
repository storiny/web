import { IncomingFriendRequest } from "@storiny/shared";
import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import FriendRequests from "./friend-requests";

describe("<FriendRequests />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <FriendRequests
        incoming_friend_requests={IncomingFriendRequest.EVERYONE}
        onSubmit={mockSubmit}
      />,
      {
        loggedIn: true
      }
    );

    await act(async () => {
      await user.click(screen.getByLabelText(/no one/i));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "friend-requests": `${IncomingFriendRequest.NONE}`
      });
    });
  });
});
