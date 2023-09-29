// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MOCK_USERS } from "../../mocks";
import FriendRequest from "./friend-request";
import FriendRequestSkeleton from "./skeleton";

const meta: Meta<typeof FriendRequest> = {
  title: "entities/friend-request",
  component: FriendRequest,
  args: {
    friend_request: {
      user: MOCK_USERS[6],
      id: "0",
      created_at: new Date().toJSON()
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof FriendRequest>;

export const Default: Story = {};

export const Skeleton: Story = {
  render: () => <FriendRequestSkeleton />
};
