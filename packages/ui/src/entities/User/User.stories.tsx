// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { mockUsers } from "../../mocks";
import UserSkeleton from "./Skeleton";
import User from "./User";

const meta: Meta<typeof User> = {
  title: "Entities/User",
  component: User,
  args: { user: mockUsers[6] },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof User>;

export const Default: Story = {};

export const BlockAction: Story = {
  args: {
    ...Default.args,
    actionType: "block"
  }
};

export const MuteAction: Story = {
  args: {
    ...Default.args,
    actionType: "mute"
  }
};

export const Skeleton: Story = {
  render: () => <UserSkeleton />
};
