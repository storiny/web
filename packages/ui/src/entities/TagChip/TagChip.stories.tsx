// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import TagChip from "./TagChip";

const meta: Meta<typeof TagChip> = {
  title: "entities/TagChip",
  component: TagChip,
  args: { value: "nice-tag", storyCount: 46, followerCount: 814 },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof TagChip>;

export const Default: Story = {};

export const OnlyValue: Story = {
  args: {
    ...Default.args,
    followerCount: undefined,
    storyCount: undefined
  }
};

export const OnlyStoryCount: Story = {
  args: {
    ...Default.args,
    followerCount: undefined
  }
};

export const OnlyFollowerCount: Story = {
  args: {
    ...Default.args,
    storyCount: undefined
  }
};
