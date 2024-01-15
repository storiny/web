// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import Mercator from "./mercator";

const meta: Meta<typeof Mercator> = {
  title: "entities/mercator",
  component: Mercator,
  args: {
    data: [
      ["JP", 245],
      ["IN", 128],
      ["CA", 366],
      ["DK", 17],
      ["HU", 199],
      ["MX", 16]
    ],
    label: {
      plural: "visitors",
      singular: "visitor"
    },
    accessibility_label: "Mercator",
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    style: { width: 640 }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Mercator>;

export const Default: Story = {};
