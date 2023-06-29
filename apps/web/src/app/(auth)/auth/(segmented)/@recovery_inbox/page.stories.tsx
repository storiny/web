// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import AuthLayout from "../../../layout";
import RecoveryInboxPage from "./page";

const meta: Meta<typeof RecoveryInboxPage> = {
  title: "pages/Auth/@recovery_inbox",
  component: RecoveryInboxPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RecoveryInboxPage>;

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
