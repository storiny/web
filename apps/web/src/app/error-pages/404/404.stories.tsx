// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import Error404Page from "./404";

const meta: Meta<typeof Error404Page> = {
  title: "pages/Error/404",
  component: Error404Page,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Error404Page>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(<Story />, { ignorePrimitiveProviders: true })
  ]
};
