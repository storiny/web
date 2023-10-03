// noinspection JSUnusedGlobalSymbols

import { MOCK_COMMENTS, MOCK_USERS } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { GetCommentResponse } from "~/common/grpc";
import { render_with_state } from "~/redux/mock";

import DefaultLayout from "../../../../layout";
import StoryComponent from "./component";

const COMMENT_USER: NonNullable<GetCommentResponse["user"]> = {
  id: MOCK_USERS[5].id,
  username: MOCK_USERS[5].username,
  bio: MOCK_USERS[5].bio,
  rendered_bio: MOCK_USERS[5].rendered_bio,
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
    ...MOCK_COMMENTS[5],
    story_writer_username: MOCK_COMMENTS[5].story?.user?.username,
    story_slug: MOCK_COMMENTS[5].story?.slug,
    edited_at: MOCK_COMMENTS[5].edited_at || undefined,
    user: COMMENT_USER
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof StoryComponent>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <Story />
        </DefaultLayout>
      )
  ]
};

export const LoggedIn: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { logged_in: true }
      )
  ]
};
