import { user_event } from "@storiny/test-utils";
import { screen } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import SiteNotifications from "./site-notifications";

describe("<SiteNotifications />", () => {
  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <SiteNotifications
        blog_requests
        collaboration_requests
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

    await user.click(screen.getByLabelText(/features & updates/i));

    expect(mock_submit).toHaveBeenCalledWith({
      blog_requests: true,
      collaboration_requests: true,
      comments: true,
      features_and_updates: false,
      friend_requests: true,
      new_followers: true,
      replies: true,
      stories: true,
      story_likes: true,
      tags: true
    });
  });
});
