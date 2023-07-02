// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import Sidenav from "./Static";

const meta: Meta<typeof Sidenav> = {
  title: "Layout/Sidenav",
  component: Sidenav,
  args: {
    forceMount: true,
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
  decorators: [(Story) => renderWithState(<Story />, { loggedIn: true })]
};
