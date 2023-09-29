// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "~/icons/Rectangle";

import Toggle from "./toggle";

const meta: Meta<typeof Toggle> = {
  title: "components/toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: {
    children: <RectangleIcon />,
    size: "md",
    "aria-label": "Toggle button"
  },
  argTypes: {
    disabled: {
      name: "disabled",
      type: { name: "boolean", required: false },
      defaultValue: false,
      description: "The disabled state.",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" }
      },
      control: {
        type: "boolean"
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {};

export const WithTooltip: Story = {
  args: {
    tooltip_content: "Tooltip content"
  }
};

export const SizeLG: Story = {
  args: {
    size: "lg"
  }
};

export const SizeMD: Story = {
  args: {
    size: "md"
  }
};

export const SizeSM: Story = {
  args: {
    size: "sm"
  }
};

export const SizeXS: Story = {
  args: {
    size: "xs"
  }
};
