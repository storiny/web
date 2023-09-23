// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { mockReplies } from "../../mocks";
import Reply from "./reply";
import ReplySkeleton from "./skeleton";

const meta: Meta<typeof Reply> = {
  title: "entities/reply",
  component: Reply,
  args: { reply: { ...mockReplies[8], hidden: false } },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Reply>;

export const Default: Story = {};

export const Hidden: Story = {
  args: { reply: { ...mockReplies[8], hidden: true } }
};

export const Static: Story = {
  args: { isStatic: true }
};

export const Skeleton: Story = {
  render: () => <ReplySkeleton />
};
