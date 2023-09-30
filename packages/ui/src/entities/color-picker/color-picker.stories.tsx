// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "~/components/button";

import ColorPicker from "./color-picker";

const meta: Meta<typeof ColorPicker> = {
  title: "entities/color-picker",
  component: ColorPicker,
  args: {
    children: <Button>Pick a color</Button>
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

export const Default: Story = {};
