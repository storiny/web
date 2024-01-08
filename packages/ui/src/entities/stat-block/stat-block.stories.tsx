// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import StatBlock from "./stat-block";

const meta: Meta<typeof StatBlock> = {
  title: "entities/stat-block",
  component: StatBlock,
  args: {
    value: "Value",
    label: "Label",
    caption: "Caption",
    caption_icon: "increment"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof StatBlock>;

export const Default: Story = {};
