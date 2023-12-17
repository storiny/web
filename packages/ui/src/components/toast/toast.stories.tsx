// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "../button";
import Toast from "./toast";
import { ToastProps } from "./toast.props";
import { use_toast } from "./use-toast";

const meta: Meta<typeof Toast> = {
  title: "components/toast",
  component: Toast,
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
type Story = StoryObj<typeof Toast>;

const ToastComponent = (props?: ToastProps): React.ReactElement => {
  const toast = use_toast();

  return (
    <Button
      onClick={(): void =>
        toast(
          (props?.children as string) || "This is a toast notification",
          props?.severity
        )
      }
    >
      Show toast
    </Button>
  );
};

export const Default: Story = {
  render: (args) => <ToastComponent {...args} />
};

export const SeverityBlank: Story = {
  ...Default,
  args: {
    severity: "blank"
  }
};

export const SeverityInfo: Story = {
  ...Default,
  args: {
    severity: "info"
  }
};

export const SeveritySuccess: Story = {
  ...Default,
  args: {
    severity: "success"
  }
};

export const SeverityError: Story = {
  ...Default,
  args: {
    severity: "error"
  }
};
