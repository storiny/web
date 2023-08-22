// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import Status from "./Status";

const meta: Meta<typeof Status> = {
  title: "Entities/Status",
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
    emoji: "/images/emoji.png"
  }
};

export const WithExpirationTime: Story = {
  args: {
    ...WithEmoji.args,
    expiresAt: "3d"
  }
};

export const WithoutText: Story = {
  args: {
    ...WithEmoji.args,
    text: undefined
  }
};

export const Editable: Story = {
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
