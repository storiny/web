// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import BottomNavigation from "./bottom-navigation";

const meta: Meta<typeof BottomNavigation> = {
  title: "layout/bottom-navigation",
  component: BottomNavigation,
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, { logged_in: true })
  ],
  args: {
    force_mount: true,
    style: { width: "320px", position: "relative" }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BottomNavigation>;

export const Default: Story = {};
