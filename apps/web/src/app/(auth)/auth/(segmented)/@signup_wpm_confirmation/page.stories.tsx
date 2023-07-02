// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import AuthLayout from "../../../layout";
import AuthSignupWPMConfirmationPage from "./page";

const meta: Meta<typeof AuthSignupWPMConfirmationPage> = {
  title: "pages/Auth/@signup_wpm_confirmation",
  component: AuthSignupWPMConfirmationPage,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AuthSignupWPMConfirmationPage>;

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
