// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MOCK_COMMENTS } from "../../mocks";
import Comment from "./comment";
import CommentSkeleton from "./skeleton";

const meta: Meta<typeof Comment> = {
  title: "entities/comment",
  component: Comment,
  args: { comment: { ...MOCK_COMMENTS[8], hidden: false } },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Comment>;

export const Default: Story = {};

export const Hidden: Story = {
  args: { comment: { ...MOCK_COMMENTS[8], hidden: true } }
};

export const Extended: Story = {
  args: { is_extended: true }
};

export const Static: Story = {
  args: { is_static: true }
};

export const Skeleton: Story = {
  render: () => <CommentSkeleton />
};

export const ExtendedSkeleton: Story = {
  render: () => <CommentSkeleton />,
  args: {
    is_extended: true
  }
};
