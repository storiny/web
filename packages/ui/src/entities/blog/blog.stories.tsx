// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MOCK_BLOGS } from "../../mocks";
import Blog from "./blog";
import BlogSkeleton from "./skeleton";

const meta: Meta<typeof Blog> = {
  title: "entities/blog",
  component: Blog,
  args: { blog: MOCK_BLOGS[6] },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Blog>;

export const Default: Story = {};

export const Skeleton: Story = {
  render: () => <BlogSkeleton />
};
