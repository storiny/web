// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "../Button";
import Notification from "./Notification";
import { NotificationProps } from "./Notification.props";

const meta: Meta<typeof Notification> = {
  title: "Components/Notification",
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

// TODO: Fix
const NotificationComponent = (
  props?: NotificationProps
): React.ReactElement => (
  <Button
  // onClick={(): void =>
  //  notify("This is a notification with a long notification content", props)
  // }
  >
    Show notification
  </Button>
);

export const Default: Story = {
  render: (args) => <NotificationComponent {...args} />
};

export const IconInfo = {
  ...Default,
  args: {
    icon: "info"
  }
};

export const IconTypography = {
  ...Default,
  args: {
    icon: "typography"
  }
};

export const IconExclamation = {
  ...Default,
  args: {
    icon: "exclamation"
  }
};
