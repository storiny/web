// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MOCK_REPLIES } from "../../mocks";
import Reply from "./reply";
import ReplySkeleton from "./skeleton";

const meta: Meta<typeof Reply> = {
  title: "entities/reply",
  component: Reply,
  args: { reply: { ...MOCK_REPLIES[8], hidden: false } },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Reply>;

export const Default: Story = {};

export const Hidden: Story = {
  args: { reply: { ...MOCK_REPLIES[8], hidden: true } }
};

export const Static: Story = {
  args: { is_static: true }
};

export const Skeleton: Story = {
  render: () => <ReplySkeleton />
};
