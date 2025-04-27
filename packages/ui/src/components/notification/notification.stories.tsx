// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Notification from "./notification";
import NotificationProvider from "./provider";

const meta: Meta<typeof Notification> = {
  title: "components/notification",
  component: Notification,
  tags: ["autodocs"],
  argTypes: {
    children: {
      name: "children",
      type: { name: "string", required: true },
      defaultValue: "",
      description: "The toast message.",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "" }
      },
      control: {
        type: "text"
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Notification>;

export const Default: Story = {
  render: (args) => (
    <NotificationProvider>
      <Notification open {...args} />
    </NotificationProvider>
  )
};
