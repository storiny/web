// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import Error504Page from "./504";

const meta: Meta<typeof Error504Page> = {
  title: "pages/Error/504",
  component: Error504Page,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Error504Page>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(<Story />, { ignorePrimitiveProviders: true }),
  ],
};
