// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import LeftSidebar from "./left-sidebar";

const meta: Meta<typeof LeftSidebar> = {
  title: "layout/left-sidebar",
  component: LeftSidebar,
  parameters: {
    layout: "fullscreen"
  },
  args: {
    force_mount: true,
    style: {
      width: "310px",
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      marginLeft: "48px"
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof LeftSidebar>;

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
      render_with_state(<Story />, { logged_in: true })
  ]
};
