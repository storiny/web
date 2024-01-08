// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "~/icons/rectangle";

import StatBlock from "./stat-block";

const meta: Meta<typeof StatBlock> = {
  title: "entities/stat-block",
  component: StatBlock,
  args: {
    value: "Value",
    label: "Label"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof StatBlock>;

export const Default: Story = {};

export const WithCaption: Story = {
  args: {
    caption: "Caption"
  }
};

export const WithIncrementCaptionIcon: Story = {
  args: {
    caption: "Increment",
    caption_icon: "increment"
  }
};

export const WithDecrementCaptionIcon: Story = {
  args: {
    caption: "Decrement",
    caption_icon: "decrement"
  }
};

export const WithCustomCaptionIcon: Story = {
  args: {
    caption: "Custom",
    caption_icon: <RectangleIcon />
  }
};
