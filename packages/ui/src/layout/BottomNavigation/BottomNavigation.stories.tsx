// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import BottomNavigation from "./BottomNavigation";

const meta: Meta<typeof BottomNavigation> = {
  title: "Layout/BottomNavigation",
  component: BottomNavigation,
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, { loggedIn: true })
  ],
  args: {
    forceMount: true,
    style: { width: "320px", position: "relative" }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BottomNavigation>;

export const Default: Story = {};
