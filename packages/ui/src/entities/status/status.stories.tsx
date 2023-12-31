// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import { MOCK_USERS } from "../../mocks";
import Status from "./status";

const meta: Meta<typeof Status> = {
  title: "entities/status",
  component: Status,
  args: {
    text: "This is a status",
    editable: false,
    user_id: MOCK_USERS[4].id
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Status>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, { logged_in: false })
  ]
};

export const WithEmoji: Story = {
  ...Default,
  args: {
    emoji: "1f33f"
  }
};

export const WithExpirationTime: Story = {
  ...Default,
  args: {
    ...WithEmoji.args,
    expires_at: new Date().toISOString()
  }
};

export const WithoutText: Story = {
  ...Default,
  args: {
    ...WithEmoji.args,
    text: undefined
  }
};

export const Editable: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, { logged_in: true })
  ],
  args: {
    editable: true,
    text: undefined
  }
};

export const EditableWithEmojiAndText: Story = {
  ...Default,
  args: {
    ...WithEmoji.args,
    text: "Click to change",
    editable: true
  }
};
