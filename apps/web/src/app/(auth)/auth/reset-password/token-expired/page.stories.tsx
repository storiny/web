// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import AuthLayout from "../../../layout";
import ResetTokenExpiredPage from "./index";

const meta: Meta<typeof ResetTokenExpiredPage> = {
  title: "pages/Auth/reset-token-expired",
  component: ResetTokenExpiredPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ResetTokenExpiredPage>;

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
