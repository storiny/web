// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "src/icons/rectangle";

import IconButton from "../icon-button";
import Tooltip from "./tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "components/tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  argTypes: {
    open: {
      options: ["Uncontrolled", "Open", "Closed"],
      control: { type: "select" },
      mapping: {
        Uncontrolled: undefined,
        Open: true,
        Closed: false
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <IconButton>
        <RectangleIcon />
      </IconButton>
    </Tooltip>
  ),
  args: {
    content: "Tooltip content"
  }
};
