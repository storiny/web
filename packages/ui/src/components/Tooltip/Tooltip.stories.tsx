// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import UserIcon from "~/icons/User";

import IconButton from "../IconButton";
import Tooltip from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "select",
      options: ["Uncontrolled", "Open", "Closed"],
      mapping: {
        Uncontrolled: undefined,
        Open: true,
        Closed: false,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <IconButton>
        <UserIcon />
      </IconButton>
    </Tooltip>
  ),
  args: {
    content: "Tooltip content",
  },
};
