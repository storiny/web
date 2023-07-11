// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Main from "./Main";

const meta: Meta<typeof Main> = {
  title: "packages/ImageEditor",
  component: Main,
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
type Story = StoryObj<typeof Main>;

export const Default: Story = {};
