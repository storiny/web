// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Switch from "./Switch";

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: { color: "inverted", size: "md", "aria-label": "Sample switch" },
  argTypes: {
    disabled: {
      name: "disabled",
      type: { name: "boolean", required: false },
      defaultValue: false,
      description: "The disabled state.",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
      control: {
        type: "boolean",
      },
    },
    checked: {
      description: "The checked state.",
      control: "select",
      options: ["Uncontrolled", "Checked", "Unchecked"],
      mapping: {
        Uncontrolled: undefined,
        Checked: true,
        Unchecked: false,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {};

export const ColorInverted: Story = {
  args: { color: "inverted" },
};

export const ColorRuby: Story = {
  args: { color: "ruby" },
};

export const SizeMD: Story = {
  args: { size: "md" },
};

export const SizeSM: Story = {
  args: { size: "sm" },
};
