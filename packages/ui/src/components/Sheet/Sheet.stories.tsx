// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Sheet from "./Sheet";

const meta: Meta<typeof Sheet> = {
  title: "Components/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  args: {
    variant: "outlined",
    style: { width: "256px", height: "256px" }
  }
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Default: Story = {};

export const VariantPlain: Story = {
  args: {
    variant: "plain"
  }
};

export const VariantOutlined: Story = {
  args: {
    variant: "outlined"
  }
};

export const VariantElevated: Story = {
  args: {
    variant: "elevated"
  }
};
