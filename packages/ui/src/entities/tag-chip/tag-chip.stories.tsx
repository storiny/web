// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import TagChip from "./tag-chip";

const meta: Meta<typeof TagChip> = {
  title: "entities/tag-chip",
  component: TagChip,
  args: { value: "nice-tag", story_count: 46, follower_count: 814 },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof TagChip>;

export const Default: Story = {};

export const OnlyValue: Story = {
  args: {
    ...Default.args,
    follower_count: undefined,
    story_count: undefined
  }
};

export const OnlyStoryCount: Story = {
  args: {
    ...Default.args,
    follower_count: undefined
  }
};

export const OnlyFollowerCount: Story = {
  args: {
    ...Default.args,
    story_count: undefined
  }
};
