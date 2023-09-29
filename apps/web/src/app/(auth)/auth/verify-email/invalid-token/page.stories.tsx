// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import AuthLayout from "../../../layout";
import VerifyEmailInvalidTokenPage from "./index";

const meta: Meta<typeof VerifyEmailInvalidTokenPage> = {
  title: "pages/Auth/verify-email-invalid-token",
  component: VerifyEmailInvalidTokenPage,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof VerifyEmailInvalidTokenPage>;

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
