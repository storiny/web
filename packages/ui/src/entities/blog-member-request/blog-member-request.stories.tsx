// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MOCK_USERS } from "../../mocks";
import BlogMemberRequest from "./blog-member-request";
import BlogMemberRequestSkeleton from "./skeleton";

const meta: Meta<typeof BlogMemberRequest> = {
  title: "entities/blog-member-request",
  component: BlogMemberRequest,
  args: {
    role: "editor",
    blog_member_request: {
      user: MOCK_USERS[6],
      id: "0",
      created_at: new Date().toJSON()
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BlogMemberRequest>;

export const Default: Story = {};

export const Skeleton: Story = {
  render: () => <BlogMemberRequestSkeleton />
};
