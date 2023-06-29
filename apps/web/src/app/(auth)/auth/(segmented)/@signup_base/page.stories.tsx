// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import AuthLayout from "../../../layout";
import AuthSignupBasePage from "./page";

const meta: Meta<typeof AuthSignupBasePage> = {
  title: "pages/Auth/@signup_base",
  component: AuthSignupBasePage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AuthSignupBasePage>;

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
