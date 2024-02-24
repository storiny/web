// noinspection JSUnusedGlobalSymbols

import { IncomingFriendRequest, RelationVisibility } from "@storiny/shared";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../../layout";
import DashboardSplashLayout from "../../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../../layout";
import DefaultDashboardRightSidebarLayout from "../../layout";
import AccountPrivacyPage from "./client";

const meta: Meta<typeof AccountPrivacyPage> = {
  title: "dashboard/account/privacy",
  component: AccountPrivacyPage,
  args: {
    is_private_account: false,
    allow_sensitive_media: true,
    following_list_visibility: RelationVisibility.EVERYONE,
    friend_list_visibility: RelationVisibility.EVERYONE,
    incoming_friend_requests: IncomingFriendRequest.EVERYONE,
    record_read_history: true
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AccountPrivacyPage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <DefaultDashboardLeftSidebarLayout>
              <DefaultDashboardRightSidebarLayout>
                <Story />
              </DefaultDashboardRightSidebarLayout>
            </DefaultDashboardLeftSidebarLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignore_primitive_providers: false, logged_in: true }
      )
  ]
};
