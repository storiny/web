// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import Mercator from "./mercator";

const meta: Meta<typeof Mercator> = {
  title: "entities/mercator",
  component: Mercator,
  args: {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    style: { width: 640, minHeight: 300 }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Mercator>;

export const Default: Story = {};
