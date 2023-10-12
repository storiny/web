import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import SiteNotifications from "./site-notifications";

describe("<SiteNotifications />", () => {
  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <SiteNotifications
        comments
        features_and_updates
        friend_requests
        new_followers
        on_submit={mock_submit}
        replies
        stories
        story_likes
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
      expect(mock_submit).toHaveBeenCalledWith({
        friend_requests: true,
        features_and_updates: false,
        new_followers: true,
        story_likes: true,
        replies: true,
        comments: true,
        tags: true,
        stories: true
      });
    });
  });
});
