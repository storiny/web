// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MOCK_STORIES } from "../../mocks";
import StorySkeleton from "./skeleton";
import Story from "./story";

const meta: Meta<typeof Story> = {
  title: "entities/story",
  component: Story,
  args: { story: MOCK_STORIES[8] },
  tags: ["autodocs"]
};

export default meta;
type TStory = StoryObj<typeof Story>;

export const Default: TStory = {};

export const Large: TStory = {
  args: { is_large: true }
};
export const Extended: TStory = {
  args: { is_extended: true }
};

export const Draft: TStory = {
  args: { is_draft: true }
};

export const Deleted: TStory = {
  args: { is_deleted: true }
};

export const Blog: TStory = {
  args: { is_blog: true }
};

export const Skeleton: TStory = {
  render: () => <StorySkeleton />
};

export const SmallSkeleton: TStory = {
  render: () => <StorySkeleton is_small />
};

export const LargeSkeleton: TStory = {
  render: () => <StorySkeleton is_large />
};
