// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import BottomNavigation from "./BottomNavigation";

const meta: Meta<typeof BottomNavigation> = {
  title: "Layout/BottomNavigation",
  component: BottomNavigation,
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(<Story />, { loggedIn: true }),
  ],
  args: {
    forceMount: true,
    style: { width: "320px", position: "relative" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BottomNavigation>;

export const Default: Story = {};
