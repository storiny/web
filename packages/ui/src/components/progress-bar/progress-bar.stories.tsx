// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import ProgressBar from "./progress-bar";

const meta: Meta<typeof ProgressBar> = {
  title: "components/progress-bar",
  component: ProgressBar,
  tags: ["autodocs"],
  args: {
    size: "md",
    "aria-label": "Sample progress bar",
    value: 64,
    style: { width: "256px" }
  }
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {};

export const SizeLG: Story = {
  args: {
    size: "lg"
  }
};

export const SizeMD: Story = {
  args: {
    size: "md"
  }
};
