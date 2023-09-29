// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { TEST_TAG } from "../../mocks";
import TagSkeleton from "./skeleton";
import Tag from "./tag";

const meta: Meta<typeof Tag> = {
  title: "entities/tag",
  component: Tag,
  args: { tag: TEST_TAG },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {};

export const Skeleton: Story = {
  render: () => <TagSkeleton />
};
