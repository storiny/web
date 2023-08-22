// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import Navbar from "./Navbar";

const meta: Meta<typeof Navbar> = {
  title: "Layout/Navbar",
  component: Navbar,
  decorators: [
    (Story): React.ReactElement => (
      <div className={"grid"}>
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
    (Story): React.ReactElement => renderWithState(<Story />, { loading: true })
  ]
};

export const LoggedIn: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(<Story />, { loggedIn: true })
  ]
};

export const VariantMinimal: Story = {
  args: {
    variant: "minimal"
  }
};
