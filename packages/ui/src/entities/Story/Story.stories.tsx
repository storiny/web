// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { mockStories } from "../../mocks";
import StorySkeleton from "./Skeleton";
import Story from "./Story";

const meta: Meta<typeof Story> = {
  title: "Entities/Story",
  component: Story,
  args: { story: mockStories[8] },
  tags: ["autodocs"]
};

export default meta;
type TStory = StoryObj<typeof Story>;

export const Default: TStory = {};

export const Draft: TStory = {
  args: { isDraft: true }
};

export const Skeleton: TStory = {
  render: () => <StorySkeleton />
};
