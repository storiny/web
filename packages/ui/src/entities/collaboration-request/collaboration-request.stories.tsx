// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MOCK_STORIES, MOCK_USERS } from "../../mocks";
import CollaborationRequest from "./collaboration-request";
import CollaborationRequestSkeleton from "./skeleton";

const meta: Meta<typeof CollaborationRequest> = {
  title: "entities/collaboration-request",
  component: CollaborationRequest,
  args: {
    type: "received",
    collaboration_request: {
      user: MOCK_USERS[6],
      story: MOCK_STORIES[6],
      role: "editor",
      id: "0",
      created_at: new Date().toJSON()
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof CollaborationRequest>;

export const Default: Story = {};

export const TypeReceived: Story = {
  args: { ...Default.args, type: "received" }
};

export const TypeSent: Story = { args: { ...Default.args, type: "sent" } };

export const DeletedUser: Story = {
  args: {
    collaboration_request: {
      user: null,
      story: MOCK_STORIES[6],
      role: "editor",
      id: "0",
      created_at: new Date().toJSON()
    }
  }
};

export const Skeleton: Story = {
  render: () => <CollaborationRequestSkeleton />
};
