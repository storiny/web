// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MOCK_USERS } from "../../mocks";
import UserSkeleton from "./skeleton";
import User from "./user";

const meta: Meta<typeof User> = {
  title: "entities/user",
  component: User,
  args: { user: MOCK_USERS[6] },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof User>;

export const Default: Story = {};

export const BlockAction: Story = {
  args: {
    ...Default.args,
    action_type: "block"
  }
};

export const MuteAction: Story = {
  args: {
    ...Default.args,
    action_type: "mute"
  }
};

export const Skeleton: Story = {
  render: () => <UserSkeleton />
};
