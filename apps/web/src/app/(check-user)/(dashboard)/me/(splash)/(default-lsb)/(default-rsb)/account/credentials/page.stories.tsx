// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DashboardLayout from "../../../../../../layout";
import DashboardSplashLayout from "../../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../../layout";
import DefaultDashboardRightSidebarLayout from "../../layout";
import AccountCredentialsPage from "./client";

const meta: Meta<typeof AccountCredentialsPage> = {
  title: "dashboard/Account/credentials",
  component: AccountCredentialsPage,
  args: {
    has_password: true,
    is_2fa_enabled: true
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AccountCredentialsPage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DashboardLayout>
          <DashboardSplashLayout>
            <DefaultDashboardLeftSidebarLayout>
              <DefaultDashboardRightSidebarLayout>
                <Story />
              </DefaultDashboardRightSidebarLayout>
            </DefaultDashboardLeftSidebarLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignorePrimitiveProviders: false, loggedIn: true }
      )
  ]
};

export const NoPassword: Story = {
  ...Default,
  args: {
    ...Default.args,
    has_password: false
  }
};

export const No2FA: Story = {
  ...Default,
  args: {
    ...Default.args,
    is_2fa_enabled: false
  }
};

export const WithConnectedAccounts: Story = {
  ...Default,
  args: {
    ...Default.args,
    login_google_id: "-",
    login_apple_id: "-"
  }
};
