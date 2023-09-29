import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import SiteNotifications from "./site-notifications";

describe("<SiteNotifications />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    render_test_with_provider(
      <SiteNotifications
        comments
        features_and_updates
        friend_requests
        new_followers
        on_submit={mockSubmit}
        replies
        stories
        tags
      />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(screen.getByLabelText(/features & updates/i));
    });

    await wait_for(() => {
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
