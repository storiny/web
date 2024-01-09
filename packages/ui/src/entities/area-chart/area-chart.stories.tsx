// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import AreaChart from "./area-chart";

const meta: Meta<typeof AreaChart> = {
  title: "entities/area-chart",
  component: AreaChart,
  args: {
    value: "Value",
    label: "Label"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AreaChart>;

export const Default: Story = {};

export const WithCaption: Story = {
  args: {
    caption: "Caption"
  }
};
