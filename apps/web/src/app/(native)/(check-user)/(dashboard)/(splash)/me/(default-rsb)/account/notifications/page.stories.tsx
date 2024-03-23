// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../layout";
import DashboardSplashLayout from "../../../../layout";
import DashboardLeftSidebarLayout from "../../../layout";
import DefaultDashboardRightSidebarLayout from "../../layout";
import AccountNotificationsPage from "./client";

const meta: Meta<typeof AccountNotificationsPage> = {
  title: "dashboard/account/notifications",
  component: AccountNotificationsPage,
  args: {
    tags: true,
    comments: true,
    features_and_updates: true,
    friend_requests: true,
    collaboration_requests: true,
    blog_requests: true,
    mail_digest: true,
    mail_features_and_updates: true,
    mail_login_activity: true,
    mail_newsletters: true,
    new_followers: true,
    replies: true,
    stories: true
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AccountNotificationsPage>;

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
