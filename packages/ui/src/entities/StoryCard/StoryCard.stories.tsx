// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { mockStories } from "../../mocks";
import StoryCardSkeleton from "./Skeleton";
import StoryCard from "./StoryCard";

const meta: Meta<typeof StoryCard> = {
  title: "Entities/StoryCard",
  args: {
    story: mockStories[4],
    style: {
      maxWidth: "300px"
    }
  },
  component: StoryCard,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof StoryCard>;

export const Default: Story = {};

export const Skeleton: Story = {
  render: (): React.ReactElement => (
    <StoryCardSkeleton style={{ maxWidth: "300px" }} />
  )
};
