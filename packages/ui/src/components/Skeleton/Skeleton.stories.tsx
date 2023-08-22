// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import Skeleton from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  args: {
    shape: "rectangular"
  }
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    style: { width: "32px", height: "32px" }
  }
};

export const ShapeRectangular: Story = {
  args: {
    style: { width: "96px", height: "32px" },
    shape: "rectangular"
  }
};

export const ShapeCircular: Story = {
  args: {
    style: { width: "64px", height: "64px" },
    shape: "circular"
  }
};
