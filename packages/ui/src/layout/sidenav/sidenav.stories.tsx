// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import Sidenav from "./static-content";

const meta: Meta<typeof Sidenav> = {
  title: "layout/sidenav",
  component: Sidenav,
  args: {
    style: {
      width: "72px",
      position: "relative"
    }
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Sidenav>;

export const Default: Story = {};

export const LoggedIn: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, { logged_in: true })
  ]
};
