import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import SiteNotifications from "./site-notifications";

describe("<SiteNotifications />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <SiteNotifications
        comments
        features_and_updates
        friend_requests
        new_followers
        onSubmit={mockSubmit}
        replies
        stories
        tags
      />,
      {
        loggedIn: true
      }
    );

    await act(async () => {
      await user.click(screen.getByLabelText(/features & updates/i));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "friend-requests": true,
        "features-and-updates": false,
        "new-followers": true,
        replies: true,
        comments: true,
        tags: true,
        stories: true
      });
    });
  });
});
