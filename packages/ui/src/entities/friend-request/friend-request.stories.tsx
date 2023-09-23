// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { mockUsers } from "../../mocks";
import FriendRequest from "./friend-request";
import FriendRequestSkeleton from "./skeleton";

const meta: Meta<typeof FriendRequest> = {
  title: "entities/FriendRequest",
  component: FriendRequest,
  args: {
    friendRequest: {
      user: mockUsers[6],
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
