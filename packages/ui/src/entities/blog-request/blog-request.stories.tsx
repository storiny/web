// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MOCK_BLOGS } from "../../mocks";
import BlogRequest from "./blog-request";
import BlogRequestSkeleton from "./skeleton";

const meta: Meta<typeof BlogRequest> = {
  title: "entities/blog-request",
  component: BlogRequest,
  args: {
    blog_request: {
      blog: MOCK_BLOGS[0],
      id: "0",
      role: "editor",
      created_at: new Date().toJSON()
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BlogRequest>;

export const Default: Story = {};

export const Skeleton: Story = {
  render: () => <BlogRequestSkeleton />
};
