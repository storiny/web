// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import ProgressBar from "./ProgressBar";

const meta: Meta<typeof ProgressBar> = {
  title: "Components/ProgressBar",
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
