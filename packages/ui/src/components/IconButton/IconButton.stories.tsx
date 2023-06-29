// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import UserIcon from "~/icons/User";

import IconButton from "./IconButton";

const meta: Meta<typeof IconButton> = {
  title: "Components/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  args: {
    children: <UserIcon />,
    size: "md",
    color: "inverted",
    variant: "rigid",
  },
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
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {};

export const VariantRigid: Story = {
  args: {
    variant: "rigid",
  },
};

export const VariantHollow: Story = {
  args: {
    variant: "hollow",
  },
};

export const VariantGhost: Story = {
  args: {
    variant: "ghost",
  },
};

export const ColorInverted: Story = {
  args: {
    color: "inverted",
  },
};

export const ColorRuby: Story = {
  args: {
    color: "ruby",
  },
};

export const SizeLG: Story = {
  args: {
    size: "lg",
  },
};

export const SizeMD: Story = {
  args: {
    size: "md",
  },
};

export const SizeSM: Story = {
  args: {
    size: "sm",
  },
};

export const SizeXS: Story = {
  args: {
    size: "xs",
  },
};
