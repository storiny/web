// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import Footer from "./Footer";

const meta: Meta<typeof Footer> = {
  title: "Layout/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen"
  },
  decorators: [
    (Story): React.ReactElement => (
      <div className={"grid"}>
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
      renderWithState(<Story />, { loggedIn: true })
  ]
};
