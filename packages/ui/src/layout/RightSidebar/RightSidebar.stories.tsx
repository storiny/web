// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import RightSidebar from "./RightSidebar";

const meta: Meta<typeof RightSidebar> = {
  title: "Layout/RightSidebar",
  component: RightSidebar,
  parameters: {
    layout: "fullscreen"
  },
  args: { forceMount: true, style: { width: "310px", marginRight: "48px" } },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof RightSidebar>;

export const Default: Story = {};

export const Loading: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, {
        loading: true
      })
  ]
};

export const LoggedIn: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, { loggedIn: true })
  ]
};
