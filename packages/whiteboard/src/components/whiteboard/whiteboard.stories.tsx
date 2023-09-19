// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import Whiteboard from "./whiteboard";

const meta: Meta<typeof Whiteboard> = {
  title: "packages/Whiteboard",
  component: Whiteboard,
  parameters: {
    layout: "fullscreen"
  },
  args: {
    style: {
      height: "100vh"
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Whiteboard>;

export const Default: Story = {};
