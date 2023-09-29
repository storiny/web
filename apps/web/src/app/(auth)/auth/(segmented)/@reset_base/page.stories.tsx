// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import AuthLayout from "../../../layout";
import ResetBasePage from "./page";

const meta: Meta<typeof ResetBasePage> = {
  title: "pages/Auth/@reset_base",
  component: ResetBasePage,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ResetBasePage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <AuthLayout>
          <Story />
        </AuthLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
