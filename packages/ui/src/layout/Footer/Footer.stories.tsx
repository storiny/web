// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import clsx from "clsx";
import React from "react";

import { render_with_state } from "~/redux/mock";

import Footer from "./Footer";

const meta: Meta<typeof Footer> = {
  title: "Layout/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen"
  },
  decorators: [
    (Story): React.ReactElement => (
      <div className={clsx("grid", "grid-container")}>
        <Story />
      </div>
    )
  ],
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {};

export const LoggedIn: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, { loggedIn: true })
  ]
};
