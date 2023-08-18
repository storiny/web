// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { mockComments } from "../../mocks";
import Comment from "./Comment";
import CommentSkeleton from "./Skeleton";

const meta: Meta<typeof Comment> = {
  title: "Entities/Comment",
  component: Comment,
  args: { comment: mockComments[8] },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Comment>;

export const Default: Story = {};

export const Extended: Story = {
  args: { isExtended: true }
};

export const Static: Story = {
  args: { isStatic: true }
};

export const Skeleton: Story = {
  render: () => <CommentSkeleton />
};
