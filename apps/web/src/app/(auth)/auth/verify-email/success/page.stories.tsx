// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import AuthLayout from "../../../layout";
import VerifyEmailSuccessPage from "./index";

const meta: Meta<typeof VerifyEmailSuccessPage> = {
  title: "pages/Auth/verify-email-success",
  component: VerifyEmailSuccessPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof VerifyEmailSuccessPage>;

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
