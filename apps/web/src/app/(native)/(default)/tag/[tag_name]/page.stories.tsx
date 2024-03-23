// noinspection JSUnusedGlobalSymbols

import { GetTagResponse } from "@storiny/proto/dist/tag_def/v1/def";
import type { Meta, StoryObj } from "@storybook/react";
import { nanoid } from "nanoid";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DefaultLayout from "../../layout";
import Tag from "./component";

const MOCK_RESPONSE: GetTagResponse = {
  name: "test-tag",
  created_at: new Date().toJSON(),
  follower_count: 1920,
  story_count: 14,
  is_following: true,
  id: nanoid()
};

const meta: Meta<typeof Tag> = {
  title: "pages/tag",
  component: Tag,
  args: {
    tag: MOCK_RESPONSE
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
