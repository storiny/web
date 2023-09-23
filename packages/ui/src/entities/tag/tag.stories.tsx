// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { testTag } from "../../mocks";
import TagSkeleton from "./skeleton";
import Tag from "./tag";

const meta: Meta<typeof Tag> = {
  title: "entities/Tag",
  component: Tag,
  args: { tag: testTag },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {};

export const Skeleton: Story = {
  render: () => <TagSkeleton />
};
