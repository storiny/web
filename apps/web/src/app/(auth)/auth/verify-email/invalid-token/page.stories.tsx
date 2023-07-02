// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

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
      renderWithState(
        <AuthLayout>
          <Story />
        </AuthLayout>,
        { ignorePrimitiveProviders: true }
      )
  ]
};
