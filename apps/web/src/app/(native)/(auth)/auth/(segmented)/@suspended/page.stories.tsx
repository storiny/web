// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import AuthLayout from "../../../layout";
import AuthSuspendedPage from "./page";

const meta: Meta<typeof AuthSuspendedPage> = {
  title: "pages/auth/@suspended",
  component: AuthSuspendedPage,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AuthSuspendedPage>;

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
