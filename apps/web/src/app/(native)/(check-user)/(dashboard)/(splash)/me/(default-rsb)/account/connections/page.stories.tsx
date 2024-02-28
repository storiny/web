// noinspection JSUnusedGlobalSymbols

import { ConnectionProvider } from "@storiny/shared";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../../layout";
import DashboardSplashLayout from "../../../../layout";
import DashboardLeftSidebarLayout from "../../../layout";
import DefaultDashboardRightSidebarLayout from "../../layout";
import AccountConnectionsPage from "./client";

const meta: Meta<typeof AccountConnectionsPage> = {
  title: "dashboard/account/connections",
  component: AccountConnectionsPage,
  args: {
    connections: [
      {
        id: "0",
        provider: ConnectionProvider.GITHUB,
        url: "/",
        created_at: new Date().toJSON(),
        display_name: "zignis",
        hidden: false
      }
    ]
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AccountConnectionsPage>;

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
