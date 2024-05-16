import { user_event } from "@storiny/test-utils";
import { TEST_BLOG } from "@storiny/ui/src/mocks";
import { screen } from "@testing-library/react";
import React from "react";

import BlogContextProvider from "~/common/context/blog";
import { render_test_with_provider } from "~/redux/test-utils";

import BlogConnectionsClient from "./client";

describe("<BlogConnectionsClient />", () => {
  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: "editor" }}>
        <BlogConnectionsClient on_submit={mock_submit} />
      </BlogContextProvider>,
      {
        logged_in: true
      }
    );

    // Clear
    for (const input of [
      "website-url",
      "public-email",
      "linkedin-url",
      "youtube-url",
      "twitch-url",
      "instagram-url",
      "twitter-url",
      "github-url"
    ]) {
      await user.clear(screen.getByTestId(`${input}-input`));
    }
    // Type
    await user.type(
      screen.getByTestId("website-url-input"),
      "https://my-website.com"
    );
    await user.type(screen.getByTestId("public-email-input"), "contact@me.com");
    await user.type(
      screen.getByTestId("linkedin-url-input"),
      "https://linkedin.com"
    );
    await user.type(
      screen.getByTestId("youtube-url-input"),
      "https://youtube.com"
    );
    await user.type(
      screen.getByTestId("twitch-url-input"),
      "https://twitch.tv"
    );
    await user.type(
      screen.getByTestId("instagram-url-input"),
      "https://instagram.com"
    );
    await user.type(
      screen.getByTestId("twitter-url-input"),
      "https://twitter.com"
    );
    await user.type(
      screen.getByTestId("github-url-input"),
      "https://github.com"
    );

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mock_submit).toHaveBeenCalledWith({
      github_url: "https://github.com",
      instagram_url: "https://instagram.com",
      linkedin_url: "https://linkedin.com",
      twitch_url: "https://twitch.tv",
      website_url: "https://my-website.com",
      twitter_url: "https://twitter.com",
      youtube_url: "https://youtube.com",
      public_email: "contact@me.com"
    });
  });
});
