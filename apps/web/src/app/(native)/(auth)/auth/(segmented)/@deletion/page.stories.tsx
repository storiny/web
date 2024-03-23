// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import AuthLayout from "../../../layout";
import AuthDeletionPage from "./page";

const meta: Meta<typeof AuthDeletionPage> = {
  title: "pages/auth/@deletion",
  component: AuthDeletionPage,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AuthDeletionPage>;

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
