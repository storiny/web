// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import Main from "./Main";

const meta: Meta<typeof Main> = {
  title: "packages/Whiteboard",
  component: Main,
  parameters: {
    layout: "fullscreen"
  },
  args: {
    onConfirm: console.log,
    style: {
      height: "100vh"
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Main>;

export const Default: Story = {};
