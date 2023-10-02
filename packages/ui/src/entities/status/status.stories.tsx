// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import Status from "./status";

const meta: Meta<typeof Status> = {
  title: "entities/status",
  component: Status,
  args: {
    text: "This is a status",
    editable: false
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Status>;

export const Default: Story = {};

export const WithEmoji: Story = {
  args: {
    emoji: "1f33f"
  }
};

export const WithExpirationTime: Story = {
  args: {
    ...WithEmoji.args,
    expires_at: "3d"
  }
};

export const WithoutText: Story = {
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
  args: {
    ...WithEmoji.args,
    text: "Click to change",
    editable: true
  }
};
