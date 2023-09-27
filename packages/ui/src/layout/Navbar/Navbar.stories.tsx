// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import clsx from "clsx";
import React from "react";

import { render_with_state } from "~/redux/mock";

import Navbar from "./Navbar";

const meta: Meta<typeof Navbar> = {
  title: "Layout/Navbar",
  component: Navbar,
  decorators: [
    (Story): React.ReactElement => (
      <div className={clsx("grid", "grid-container")}>
        <Story />
      </div>
    )
  ],
  parameters: {
    layout: "fullscreen"
  },
  args: { variant: "default" },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Navbar>;

export const Default: Story = {};

export const Loading: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, { loading: true })
  ]
};

export const LoggedIn: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, { loggedIn: true })
  ]
};

export const VariantMinimal: Story = {
  args: {
    variant: "minimal"
  }
};
