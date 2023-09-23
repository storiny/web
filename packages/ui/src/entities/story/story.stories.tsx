// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { mockStories } from "../../mocks";
import StorySkeleton from "./skeleton";
import Story from "./story";

const meta: Meta<typeof Story> = {
  title: "entities/Story",
  component: Story,
  args: { story: mockStories[8] },
  tags: ["autodocs"]
};

export default meta;
type TStory = StoryObj<typeof Story>;

export const Default: TStory = {};

export const Extended: TStory = {
  args: { isExtended: true }
};

export const Draft: TStory = {
  args: { isDraft: true }
};

export const Deleted: TStory = {
  args: { isDeleted: true }
};

export const Skeleton: TStory = {
  render: () => <StorySkeleton />
};

export const SmallSkeleton: TStory = {
  render: () => <StorySkeleton isSmall />
};
