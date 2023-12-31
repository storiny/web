// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import Error504Page from "./504";

const meta: Meta<typeof Error504Page> = {
  title: "pages/error/504",
  component: Error504Page,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Error504Page>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(<Story />, { ignore_primitive_providers: true })
  ]
};
