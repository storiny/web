// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MOCK_STORIES } from "../../mocks";
import StoryCardSkeleton from "./skeleton";
import StoryCard from "./story-card";

const meta: Meta<typeof StoryCard> = {
  title: "entities/story-card",
  args: {
    story: MOCK_STORIES[8],
    style: {
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
