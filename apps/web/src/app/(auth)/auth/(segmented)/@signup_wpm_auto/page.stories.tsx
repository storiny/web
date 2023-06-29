// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import AuthLayout from "../../../layout";
import AuthSignupWPMAutoPage from "./page";

const meta: Meta<typeof AuthSignupWPMAutoPage> = {
  title: "pages/Auth/@signup_wpm_auto",
  component: AuthSignupWPMAutoPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AuthSignupWPMAutoPage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <AuthLayout>
          <Story />
        </AuthLayout>,
        { ignorePrimitiveProviders: true }
      ),
  ],
};
