// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { mockComments } from "../../mocks";
import Comment from "./comment";
import CommentSkeleton from "./skeleton";

const meta: Meta<typeof Comment> = {
  title: "entities/Comment",
  component: Comment,
  args: { comment: { ...mockComments[8], hidden: false } },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Comment>;

export const Default: Story = {};

export const Hidden: Story = {
  args: { comment: { ...mockComments[8], hidden: true } }
};

export const Extended: Story = {
  args: { isExtended: true }
};

export const Static: Story = {
  args: { isStatic: true }
};

export const Skeleton: Story = {
  render: () => <CommentSkeleton />
};

export const ExtendedSkeleton: Story = {
  render: () => <CommentSkeleton />,
  args: {
    isExtended: true
  }
};
