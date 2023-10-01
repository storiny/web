// noinspection JSUnusedGlobalSymbols

import { MOCK_STORIES, MOCK_USERS } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { GetStoryResponse } from "~/common/grpc";
import { render_with_state } from "~/redux/mock";

import StoryComponent from "./component";

const STORY_USER: NonNullable<GetStoryResponse["user"]> = {
  id: MOCK_USERS[5].id,
  username: MOCK_USERS[5].username,
  bio: MOCK_USERS[5].bio,
  name: MOCK_USERS[5].name,
  avatar_id: MOCK_USERS[5].avatar_id || undefined,
  avatar_hex: MOCK_USERS[5].avatar_hex || undefined,
  public_flags: MOCK_USERS[5].public_flags,
  is_private: MOCK_USERS[5].is_private,
  created_at: MOCK_USERS[5].created_at,
  follower_count: MOCK_USERS[5].follower_count,
  location: MOCK_USERS[5].location
};

const meta: Meta<typeof StoryComponent> = {
  title: "pages/story/comments",
  component: StoryComponent,
  args: {
    story: MOCK_STORIES[5]
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof StoryComponent>;

export const Default: Story = {};

export const LoggedIn: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, { logged_in: true })
  ]
};
