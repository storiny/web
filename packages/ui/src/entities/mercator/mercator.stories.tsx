// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import Mercator from "./mercator";

const meta: Meta<typeof Mercator> = {
  title: "entities/mercator",
  component: Mercator,
  args: {
    data: [
      { code: "AQ", value: 245 },
      { code: "IN", value: 128 },
      { code: "CA", value: 1024 },
      { code: "DK", value: 17 },
      { code: "HU", value: 199 },
      { code: "MX", value: 12 }
    ],
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    style: { width: 640, minHeight: 300 }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Mercator>;

export const Default: Story = {};
