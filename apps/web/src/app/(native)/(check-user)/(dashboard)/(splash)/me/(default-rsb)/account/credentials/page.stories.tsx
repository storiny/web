// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../layout";
import DashboardSplashLayout from "../../../../layout";
import DashboardLeftSidebarLayout from "../../../layout";
import DefaultDashboardRightSidebarLayout from "../../layout";
import AccountCredentialsPage from "./client";

const meta: Meta<typeof AccountCredentialsPage> = {
  title: "dashboard/account/credentials",
  component: AccountCredentialsPage,
  args: {
    has_password: true,
    mfa_enabled: true
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
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <DashboardLeftSidebarLayout>
              <DefaultDashboardRightSidebarLayout>
                <Story />
              </DefaultDashboardRightSidebarLayout>
            </DashboardLeftSidebarLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignore_primitive_providers: false, logged_in: true }
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
    mfa_enabled: false
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
