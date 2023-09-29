import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "src/icons/rectangle";

import NavigationItem from "./navigation-item";

const meta: Meta<typeof NavigationItem> = {
  title: "components/navigation-item",
  component: NavigationItem,
  args: {
    children: "Navigation item"
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
      control: { type: "select" },
      mapping: {
        Icon: <RectangleIcon />,
        None: undefined
      }
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof NavigationItem>;

export const Default: Story = {};
