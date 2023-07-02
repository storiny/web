// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import UserIcon from "~/icons/User";

import Chip from "./Chip";

const meta: Meta<typeof Chip> = {
  title: "Components/Chip",
  component: Chip,
  tags: ["autodocs"],
  args: {
    children: "Chip",
    size: "md",
    variant: "rigid",
    type: "static"
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
    },
    decorator: {
      options: ["Icon", "None"],
      mapping: {
        Icon: <UserIcon />,
        None: undefined
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {};

export const Static: Story = {
  args: {
    type: "static"
  }
};

export const Clickable: Story = {
  args: {
    type: "clickable"
  }
};

export const Deletable: Story = {
  args: {
    type: "deletable"
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
