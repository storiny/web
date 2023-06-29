// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import LeftSidebar from "./LeftSidebar";

const meta: Meta<typeof LeftSidebar> = {
  title: "Layout/LeftSidebar",
  component: LeftSidebar,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    forceMount: true,
    style: {
      width: "310px",
      marginLeft: "48px",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LeftSidebar>;

export const Default: Story = {};

export const Loading: Story = {
  decorators: [
    (Story) =>
      renderWithState(<Story />, {
        loading: true,
      }),
  ],
};

export const LoggedIn: Story = {
  decorators: [(Story) => renderWithState(<Story />, { loggedIn: true })],
};
