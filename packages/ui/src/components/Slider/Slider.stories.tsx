// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Slider from "./Slider";

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
    "aria-label": "Sample slider",
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    style: { width: "150px" },
  },
};

export const OrientationHorizontal: Story = {
  args: {
    ...Default.args,
    orientation: "horizontal",
  },
};

export const OrientationVertical: Story = {
  args: {
    ...Default.args,
    orientation: "vertical",
    style: { height: "150px" },
  },
};
