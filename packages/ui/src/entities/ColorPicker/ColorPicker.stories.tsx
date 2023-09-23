// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "~/components/Button";

import ColorPicker from "./ColorPicker";

const meta: Meta<typeof ColorPicker> = {
  title: "entities/ColorPicker",
  component: ColorPicker,
  args: {
    children: <Button>Pick a color</Button>
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

export const Default: Story = {};
